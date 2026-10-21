"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { addCredits, creditBalance, runDraw } from "@/lib/game";
import { notify } from "@/lib/social";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

/** The receiver confirms a handoff happened. This is what makes a giveaway count for the lottery. */
export async function confirmReceived(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT user_id, title, price_cents, received_at FROM listings WHERE id = ? AND buyer_id = ? AND status = 'sold'").get(id, user.id) as
    { user_id: number; title: string; price_cents: number; received_at: string | null } | undefined;
  if (!l || l.received_at) return;
  db.prepare("UPDATE listings SET received_at = datetime('now') WHERE id = ?").run(id);
  if (l.price_cents === 0) notify(l.user_id, "Giveaway confirmed 🎁", `${user.name} confirmed they received "${l.title}". It now counts towards your lottery tickets.`, "/lottery");
  revalidatePath(`/listings/${id}`); revalidatePath("/lottery"); revalidatePath("/me");
}

/** Buyer spends credits on a listing that accepts them. Credits move to the seller immediately and the
 *  item is reserved for the buyer. If the seller later re-opens or deletes the listing, the credits come back. */
export async function payWithCredits(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT user_id, title, price_cents, accepts_credits, status FROM listings WHERE id = ?").get(id) as
    { user_id: number; title: string; price_cents: number; accepts_credits: number; status: string } | undefined;
  if (!l || !l.accepts_credits) return { error: "This listing doesn't take credits." };
  if (l.status !== "available") return { error: "Someone got there first." };
  if (l.user_id === user.id) return { error: "That's your own listing." };
  if (creditBalance(user.id) < l.price_cents) return { error: "Not enough credits." };
  db.transaction(() => {
    addCredits(user.id, -l.price_cents, `Reserved "${l.title}"`, id);
    addCredits(l.user_id, l.price_cents, `${user.name} reserved "${l.title}" with credits`, id);
    db.prepare("UPDATE listings SET status = 'pending', buyer_id = ?, credit_paid_cents = ? WHERE id = ?").run(user.id, l.price_cents, id);
  })();
  notify(l.user_id, `${user.name} paid with credits`, `"${l.title}" is reserved for them. ${l.price_cents / 100} credits are in your balance. Arrange the handoff, then mark it gone.`, `/listings/${id}`);
  revalidatePath(`/listings/${id}`); revalidatePath("/");
  redirect(`/listings/${id}?reserved=1`);
}

// ---------- admin ----------

export async function createDraw(_prev: FormState, fd: FormData): Promise<FormState> {
  try { await requireAdmin(); } catch (e) { return { error: (e as Error).message }; }
  const title = str(fd, "title"), description = str(fd, "description"), endsAt = str(fd, "ends_at");
  if (!title) return { error: "Give the draw a name." };
  const end = new Date(endsAt);
  if (isNaN(end.getTime()) || end.getTime() < Date.now()) return { error: "Pick an end date in the future." };
  const prizes: { title: string; credits: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const t = str(fd, `prize_${i}`); if (!t) continue;
    prizes.push({ title: t, credits: Math.max(0, Math.round(parseFloat(str(fd, `credits_${i}`) || "0") * 100)) });
  }
  if (prizes.length === 0) return { error: "Add at least one prize." };
  const db = getDb();
  const drawId = db.transaction(() => {
    const r = db.prepare("INSERT INTO draws (title, description, ends_at) VALUES (?, ?, ?)").run(title, description, end.toISOString().slice(0, 19).replace("T", " "));
    const ins = db.prepare("INSERT INTO prizes (draw_id, title, credit_cents, position) VALUES (?, ?, ?, ?)");
    prizes.forEach((p, i) => ins.run(r.lastInsertRowid, p.title, p.credits, i));
    return Number(r.lastInsertRowid);
  })();
  // Tell everyone there's something to play for.
  const users = db.prepare("SELECT id FROM users WHERE verified = 1").all() as { id: number }[];
  for (const u of users) notify(u.id, `🎟️ New draw: ${title}`, `Give away items to earn tickets. ${prizes.length} prize${prizes.length === 1 ? "" : "s"} up for grabs.`, "/lottery");
  revalidatePath("/lottery"); revalidatePath("/admin");
  redirect(`/lottery?created=${drawId}`);
}

export async function runDrawNow(fd: FormData) {
  await requireAdmin();
  runDraw(Number(fd.get("id")));
  revalidatePath("/lottery"); revalidatePath("/admin");
  redirect("/lottery");
}

export async function grantCredits(_prev: FormState, fd: FormData): Promise<FormState> {
  let admin;
  try { admin = await requireAdmin(); } catch (e) { return { error: (e as Error).message }; }
  const email = str(fd, "email").toLowerCase(); const amount = Math.round(parseFloat(str(fd, "amount")) * 100); const reason = str(fd, "reason") || "Granted by organisers";
  if (!amount || isNaN(amount)) return { error: "Enter an amount (negative to deduct)." };
  const u = getDb().prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (!u) return { error: "No user with that email." };
  addCredits(u.id, amount, reason);
  notify(u.id, amount > 0 ? `⭐ You received ${amount / 100} credits` : `${-amount / 100} credits were removed`, `${reason} (by ${admin.name})`, "/me");
  revalidatePath("/admin");
  redirect("/admin?granted=1");
}
