"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { BOOST_COST, BOOST_DAYS, CREDIT_PER_HANDOFF, DAILY_COUNT_CAP, PAIR_CAP_PER_MONTH, POINTS_GIVEAWAY, POINTS_SALE } from "@/lib/config";
import { activeBoost, addCredits, creditBalance, runDraw } from "@/lib/game";
import { notify } from "@/lib/social";
import { logAdmin } from "@/lib/moderation";
import { parseSchoolLocal, sqlTime, startOfSchoolDay, startOfSchoolMonth } from "@/lib/time";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

/** The receiver confirms a handoff happened. This is the only thing that earns the giver points,
 *  draw entries and a credit, and only inside the fair-play limits:
 *  - the listing has a photo
 *  - the same two students haven't already had PAIR_CAP_PER_MONTH counted handoffs this month
 *  - the giver hasn't already had DAILY_COUNT_CAP counted handoffs today */
export async function confirmReceived(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT user_id, title, price_cents, received_at FROM listings WHERE id = ? AND buyer_id = ? AND status = 'sold'").get(id, user.id) as
    { user_id: number; title: string; price_cents: number; received_at: string | null } | undefined;
  if (!l || l.received_at || l.user_id === user.id) return;
  const hasPhoto = !!db.prepare("SELECT 1 FROM listing_images WHERE listing_id = ?").get(id);
  const pair = (db.prepare(
    `SELECT COUNT(*) c FROM listings WHERE status = 'sold' AND received_at IS NOT NULL AND counted = 1 AND received_at >= ?
       AND ((user_id = ? AND buyer_id = ?) OR (user_id = ? AND buyer_id = ?))`)
    .get(sqlTime(startOfSchoolMonth()), l.user_id, user.id, user.id, l.user_id) as { c: number }).c;
  const today = (db.prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold' AND received_at IS NOT NULL AND counted = 1 AND received_at >= ?")
    .get(l.user_id, sqlTime(startOfSchoolDay())) as { c: number }).c;
  const why = !hasPhoto ? "the listing had no photo"
    : pair >= PAIR_CAP_PER_MONTH ? `only ${PAIR_CAP_PER_MONTH} handoffs between the same two students count each month`
    : today >= DAILY_COUNT_CAP ? `only ${DAILY_COUNT_CAP} handoffs count per day`
    : null;
  const points = l.price_cents === 0 ? POINTS_GIVEAWAY : POINTS_SALE;
  db.transaction(() => {
    db.prepare("UPDATE listings SET received_at = datetime('now'), counted = ? WHERE id = ?").run(why ? 0 : 1, id);
    if (!why && CREDIT_PER_HANDOFF > 0) addCredits(l.user_id, CREDIT_PER_HANDOFF, `Handoff confirmed: "${l.title}"`, id);
  })();
  notify(l.user_id, "Handoff confirmed",
    why ? `${user.name} confirmed they received "${l.title}". It doesn't add points this time, because ${why}.`
      : `${user.name} confirmed they received "${l.title}". That's ${points} points and ${CREDIT_PER_HANDOFF / 100} credit for you.`, "/me");
  revalidatePath(`/listings/${id}`); revalidatePath("/draw"); revalidatePath("/me");
}

/** The named receiver says they never got the item. The listing goes back on the shelf. */
export async function declineReceived(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT user_id, title FROM listings WHERE id = ? AND buyer_id = ? AND status IN ('sold', 'pending') AND received_at IS NULL").get(id, user.id) as
    { user_id: number; title: string } | undefined;
  if (!l) return;
  db.prepare("UPDATE listings SET status = 'available', buyer_id = NULL, closed_at = NULL WHERE id = ?").run(id);
  notify(l.user_id, "Handoff not confirmed", `${user.name} says they don't have "${l.title}". It's back on the shelf as available.`, `/listings/${id}`);
  revalidatePath(`/listings/${id}`); revalidatePath("/");
  redirect(`/listings/${id}`);
}

/** Spend credits to put one of your listings at the top of the shelves for a few days. */
export async function boostListing(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT title, status, (boosted_until IS NOT NULL AND boosted_until > datetime('now')) AS boosted FROM listings WHERE id = ? AND user_id = ?").get(id, user.id) as
    { title: string; status: string; boosted: number } | undefined;
  if (!l) return { error: "That isn't your listing." };
  if (l.status !== "available") return { error: "Only available listings can be boosted." };
  if (l.boosted) return { error: "This listing is already boosted." };
  const running = activeBoost(user.id);
  if (running) return { error: `You're already boosting "${running.title}". One boost at a time.` };
  let short = false;
  db.transaction(() => {
    if (creditBalance(user.id) < BOOST_COST) { short = true; return; }
    addCredits(user.id, -BOOST_COST, `Boosted "${l.title}" for ${BOOST_DAYS} days`, id);
    db.prepare("UPDATE listings SET boosted_until = datetime('now', ?) WHERE id = ?").run(`+${BOOST_DAYS} days`, id);
  })();
  if (short) return { error: `A boost costs ${BOOST_COST / 100} credits. You earn one for every confirmed handoff.` };
  revalidatePath("/"); revalidatePath(`/listings/${id}`); revalidatePath("/me");
  redirect(`/listings/${id}?boosted=1`);
}

// ---------- organisers ----------

export async function createDraw(_prev: FormState, fd: FormData): Promise<FormState> {
  let admin;
  try { admin = await requireAdmin(); } catch (e) { return { error: (e as Error).message }; }
  const title = str(fd, "title").slice(0, 80), description = str(fd, "description").slice(0, 300);
  if (!title) return { error: "Give the draw a name." };
  // The time typed in the form is school time.
  const end = parseSchoolLocal(str(fd, "ends_at"));
  if (!end || end.getTime() < Date.now()) return { error: "Pick an end date in the future." };
  const prizes: { title: string; credits: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const t = str(fd, `prize_${i}`).slice(0, 80); if (!t) continue;
    const credits = Math.round(parseFloat(str(fd, `credits_${i}`) || "0") * 100);
    if (!Number.isFinite(credits) || credits < 0 || credits > 100_00) return { error: "Prize credits must be between 0 and 100." };
    prizes.push({ title: t, credits });
  }
  if (prizes.length === 0) return { error: "Add at least one prize." };
  const db = getDb();
  const drawId = db.transaction(() => {
    const r = db.prepare("INSERT INTO draws (title, description, ends_at) VALUES (?, ?, ?)").run(title, description, sqlTime(end));
    const ins = db.prepare("INSERT INTO prizes (draw_id, title, credit_cents, position) VALUES (?, ?, ?, ?)");
    prizes.forEach((p, i) => ins.run(r.lastInsertRowid, p.title, p.credits, i));
    // Tell everyone there's a new draw.
    const note = db.prepare("INSERT INTO notifications (user_id, title, body, link) SELECT id, ?, ?, '/draw' FROM users WHERE verified = 1 AND suspended_at IS NULL");
    note.run(`New giveaway draw: ${title}`, `Give things away to earn entries. ${prizes.length} prize${prizes.length === 1 ? "" : "s"} this time.`);
    return Number(r.lastInsertRowid);
  })();
  logAdmin(admin, "Created a draw", title);
  revalidatePath("/draw"); revalidatePath("/admin");
  redirect(`/draw?created=${drawId}`);
}

export async function runDrawNow(fd: FormData) {
  const admin = await requireAdmin();
  runDraw(Number(fd.get("id")));
  logAdmin(admin, "Drew winners early", `Draw ${Number(fd.get("id"))}`);
  revalidatePath("/draw"); revalidatePath("/admin");
  redirect("/draw");
}

export async function grantCredits(_prev: FormState, fd: FormData): Promise<FormState> {
  let admin;
  try { admin = await requireAdmin(); } catch (e) { return { error: (e as Error).message }; }
  const email = str(fd, "email").toLowerCase(); const amount = Math.round(parseFloat(str(fd, "amount")) * 100); const reason = str(fd, "reason").slice(0, 120) || "From the organisers";
  if (!amount || !Number.isFinite(amount)) return { error: "Enter an amount (negative to take credits away)." };
  if (Math.abs(amount) > 100_00) return { error: "That's more than 100 credits at once. Split it up if you mean it." };
  const u = getDb().prepare("SELECT id, name FROM users WHERE email = ?").get(email) as { id: number; name: string } | undefined;
  if (!u) return { error: "No student with that email." };
  const balance = creditBalance(u.id);
  if (amount < 0 && balance + amount < 0) return { error: `${u.name} only has ${Math.max(0, balance) / 100} credits. A balance can't go below zero.` };
  addCredits(u.id, amount, reason);
  notify(u.id, amount > 0 ? `You received ${amount / 100} credits` : `${-amount / 100} credits were removed`, `${reason} (by ${admin.name})`, "/me#credits");
  logAdmin(admin, amount > 0 ? "Granted credits" : "Removed credits", u.name, `${amount / 100} · ${reason}`);
  revalidatePath("/admin");
  redirect("/admin?granted=1");
}
