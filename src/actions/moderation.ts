"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser, requireAdmin, requireUser, safeNext } from "@/lib/auth";
import { ADMIN_EMAILS, LIMITS, RATE } from "@/lib/config";
import { fanOutNewListing, getThread, notify } from "@/lib/social";
import { REPORT_REASONS, TARGET_TYPES, describeTarget, logAdmin, notifyAdmins, type TargetType } from "@/lib/moderation";
import { deleteImages } from "@/lib/upload";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

// ---------- students ----------

/** Report a listing, a wanted post, a chat or a student to the organisers. */
export async function reportThing(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const type = str(fd, "type") as TargetType; const id = Number(fd.get("id"));
  const reason = str(fd, "reason"); const details = str(fd, "details");
  if (!TARGET_TYPES.includes(type) || !Number.isInteger(id)) return { error: "Something went wrong. Try again." };
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return { error: "Pick a reason." };
  if (details.length > 500) return { error: "Keep the details under 500 characters." };
  // You can only report a chat you're in.
  if (type === "thread" && !getThread(id, user.id)) return { error: "That conversation doesn't exist." };
  const target = describeTarget(type, id, user.id);
  if (!target) return { error: "That's no longer there." };
  if (type !== "thread" && target.ownerId === user.id) return { error: "That one is yours." };
  const db = getDb();
  if (db.prepare("SELECT 1 FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'open'").get(user.id, type, id)) {
    return { ok: true, message: "You've already reported this. An organiser will look at it." };
  }
  const today = (db.prepare("SELECT COUNT(*) c FROM reports WHERE reporter_id = ? AND created_at > datetime('now', '-1 day')").get(user.id) as { c: number }).c;
  if (today >= RATE.reportsPerDay) return { error: "You've sent a lot of reports today. If something is urgent, talk to an adult you trust." };
  db.prepare("INSERT INTO reports (reporter_id, target_type, target_id, reason, details) VALUES (?, ?, ?, ?, ?)").run(user.id, type, id, reason, details);
  notifyAdmins("New report", `${target.label} · ${reason}`, "/admin/reports");
  return { ok: true, message: "Thanks. An organiser will look at this. The other person isn't told who reported it." };
}

/** Stop another student messaging you. You also stop seeing each other's posts. */
export async function blockUser(fd: FormData) {
  const user = await requireUser();
  const other = Number(fd.get("user_id"));
  if (Number.isInteger(other) && other !== user.id && getDb().prepare("SELECT 1 FROM users WHERE id = ?").get(other)) {
    getDb().prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)").run(user.id, other);
  }
  revalidatePath("/", "layout");
  redirect(safeNext(fd.get("back")) === "/" ? `/u/${other}` : safeNext(fd.get("back")));
}

export async function unblockUser(fd: FormData) {
  const user = await requireUser();
  const other = Number(fd.get("user_id"));
  getDb().prepare("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?").run(user.id, other);
  revalidatePath("/", "layout");
  redirect(safeNext(fd.get("back")) === "/" ? `/u/${other}` : safeNext(fd.get("back")));
}

/** Students who joined before the rules existed are asked to agree once. */
export async function acceptRules() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  getDb().prepare("UPDATE users SET rules_accepted_at = datetime('now') WHERE id = ? AND rules_accepted_at IS NULL").run(user.id);
  redirect("/");
}

// ---------- organisers ----------

function removeListing(id: number, reason: string) {
  const db = getDb();
  const l = db.prepare("SELECT user_id, title, status FROM listings WHERE id = ?").get(id) as { user_id: number; title: string; status: string } | undefined;
  if (!l || l.status === "removed") return null;
  db.prepare("UPDATE listings SET status = 'removed', removed_reason = ?, boosted_until = NULL WHERE id = ?").run(reason, id);
  notify(l.user_id, "A listing of yours was removed", `"${l.title}" was taken down by an organiser. Reason: ${reason}. See the rules for what can be listed.`, "/rules");
  return l;
}

function removeWant(id: number, reason: string) {
  const db = getDb();
  const w = db.prepare("SELECT user_id, title, status FROM wants WHERE id = ?").get(id) as { user_id: number; title: string; status: string } | undefined;
  if (!w || w.status === "removed") return null;
  db.prepare("UPDATE wants SET status = 'removed', removed_reason = ? WHERE id = ?").run(reason, id);
  notify(w.user_id, "A wanted post of yours was removed", `"${w.title}" was taken down by an organiser. Reason: ${reason}. See the rules for what can be posted.`, "/rules");
  return w;
}

function suspend(userId: number, reason: string): string | null {
  const db = getDb();
  const u = db.prepare("SELECT name, email, suspended_at FROM users WHERE id = ?").get(userId) as { name: string; email: string; suspended_at: string | null } | undefined;
  if (!u) return null;
  if (ADMIN_EMAILS.includes(u.email.toLowerCase())) throw new Error("Organisers can't be paused here. Remove them from the organisers list first.");
  if (!u.suspended_at) db.prepare("UPDATE users SET suspended_at = datetime('now'), suspended_reason = ? WHERE id = ?").run(reason, userId);
  return u.name;
}

/** Act on a report: dismiss it, take the post down, remove a profile photo, or pause the account. */
export async function resolveReport(_prev: FormState, fd: FormData): Promise<FormState> {
  let admin;
  try { admin = await requireAdmin(); } catch (e) { return { error: (e as Error).message }; }
  const id = Number(fd.get("id")); const decision = str(fd, "decision"); const note = str(fd, "note").slice(0, LIMITS.reason);
  const db = getDb();
  const r = db.prepare("SELECT * FROM reports WHERE id = ? AND status = 'open'").get(id) as
    { id: number; reporter_id: number; target_type: TargetType; target_id: number; reason: string } | undefined;
  if (!r) return { error: "That report has already been dealt with." };
  const target = describeTarget(r.target_type, r.target_id, r.reporter_id);
  const reason = note || r.reason;
  let resolution: string;
  try {
    if (decision === "dismiss") resolution = "No action needed";
    else if (decision === "remove" && r.target_type === "listing") { removeListing(r.target_id, reason); resolution = "Listing removed"; }
    else if (decision === "remove" && r.target_type === "want") { removeWant(r.target_id, reason); resolution = "Wanted post removed"; }
    else if (decision === "photo" && target?.ownerId) {
      const u = db.prepare("SELECT avatar FROM users WHERE id = ?").get(target.ownerId) as { avatar: string | null };
      db.prepare("UPDATE users SET avatar = NULL WHERE id = ?").run(target.ownerId);
      await deleteImages([u.avatar]);
      notify(target.ownerId, "Your profile photo was removed", `An organiser removed your profile photo. Reason: ${reason}.`, "/rules");
      resolution = "Profile photo removed";
    } else if (decision === "suspend" && target?.ownerId) {
      if (r.target_type === "listing") removeListing(r.target_id, reason);
      if (r.target_type === "want") removeWant(r.target_id, reason);
      suspend(target.ownerId, reason);
      resolution = `Account paused: ${target.ownerName}`;
    } else return { error: "That action doesn't fit this report." };
  } catch (e) { return { error: (e as Error).message }; }
  db.prepare("UPDATE reports SET status = 'resolved', resolved_by = ?, resolution = ?, resolved_at = datetime('now') WHERE id = ?").run(admin.id, note ? `${resolution} · ${note}` : resolution, id);
  // Other open reports about the same thing are settled by the same decision.
  if (decision !== "dismiss") {
    db.prepare("UPDATE reports SET status = 'resolved', resolved_by = ?, resolution = ?, resolved_at = datetime('now') WHERE status = 'open' AND target_type = ? AND target_id = ?")
      .run(admin.id, resolution, r.target_type, r.target_id);
  }
  notify(r.reporter_id, "An organiser looked at your report", "Thanks for speaking up. It has been dealt with.", "/help");
  logAdmin(admin, resolution, target?.label ?? `${r.target_type} ${r.target_id}`, note);
  revalidatePath("/admin/reports"); revalidatePath("/");
  return { ok: true };
}

/** Approve or reject a post that was held because it mentioned something not allowed. */
export async function reviewHeld(fd: FormData) {
  const admin = await requireAdmin();
  const type = str(fd, "type"); const id = Number(fd.get("id")); const approve = str(fd, "decision") === "approve";
  const db = getDb();
  if (type === "listing") {
    const l = db.prepare("SELECT user_id, title FROM listings WHERE id = ? AND status = 'review'").get(id) as { user_id: number; title: string } | undefined;
    if (l && approve) {
      db.prepare("UPDATE listings SET status = 'available', held_reason = NULL, created_at = datetime('now') WHERE id = ?").run(id);
      fanOutNewListing(id);
      notify(l.user_id, "Your listing is live", `An organiser checked "${l.title}" and it's on the shelves now.`, `/listings/${id}`);
      logAdmin(admin, "Approved a held listing", l.title);
    } else if (l) { removeListing(id, "Not allowed on the site"); logAdmin(admin, "Rejected a held listing", l.title); }
  } else if (type === "want") {
    const w = db.prepare("SELECT user_id, title FROM wants WHERE id = ? AND status = 'review'").get(id) as { user_id: number; title: string } | undefined;
    if (w && approve) {
      db.prepare("UPDATE wants SET status = 'open', held_reason = NULL WHERE id = ?").run(id);
      notify(w.user_id, "Your wanted post is live", `An organiser checked "${w.title}" and it's on the board now.`, `/wanted/${id}`);
      logAdmin(admin, "Approved a held wanted post", w.title);
    } else if (w) { removeWant(id, "Not allowed on the site"); logAdmin(admin, "Rejected a held wanted post", w.title); }
  } else if (type === "avatar") {
    const u = db.prepare("SELECT name, avatar, avatar_pending FROM users WHERE id = ? AND avatar_pending IS NOT NULL").get(id) as { name: string; avatar: string | null; avatar_pending: string } | undefined;
    if (u && approve) {
      db.prepare("UPDATE users SET avatar = avatar_pending, avatar_pending = NULL, avatar_held_reason = NULL WHERE id = ?").run(id);
      await deleteImages([u.avatar]);
      notify(id, "Your new profile photo is live", "An organiser checked it and it's on your profile now.", "/me");
      logAdmin(admin, "Approved a held profile photo", u.name);
    } else if (u) {
      db.prepare("UPDATE users SET avatar_pending = NULL, avatar_held_reason = NULL WHERE id = ?").run(id);
      await deleteImages([u.avatar_pending]);
      notify(id, "Your new profile photo wasn't approved", "An organiser looked at it and it isn't right for the site. Please pick a different one. See the rules.", "/rules");
      logAdmin(admin, "Rejected a held profile photo", u.name);
    }
  }
  revalidatePath("/admin/reports"); revalidatePath("/"); revalidatePath("/wanted"); revalidatePath("/", "layout");
}

/** Take down any listing straight from its page. */
export async function removeListingNow(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id")); const reason = str(fd, "reason").slice(0, LIMITS.reason) || "Not allowed on the site";
  const l = removeListing(id, reason);
  if (l) logAdmin(admin, "Listing removed", l.title, reason);
  revalidatePath("/"); revalidatePath(`/listings/${id}`);
  redirect(`/listings/${id}`);
}

export async function restoreListing(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT user_id, title FROM listings WHERE id = ? AND status = 'removed'").get(id) as { user_id: number; title: string } | undefined;
  if (l) {
    db.prepare("UPDATE listings SET status = 'available', removed_reason = NULL WHERE id = ?").run(id);
    notify(l.user_id, "Your listing is back", `An organiser put "${l.title}" back on the shelves.`, `/listings/${id}`);
    logAdmin(admin, "Listing restored", l.title);
  }
  revalidatePath("/"); revalidatePath(`/listings/${id}`);
  redirect(`/listings/${id}`);
}

/** Pause an account by email. A paused student can't post, message or confirm anything. */
export async function suspendUser(_prev: FormState, fd: FormData): Promise<FormState> {
  let admin;
  try { admin = await requireAdmin(); } catch (e) { return { error: (e as Error).message }; }
  const email = str(fd, "email").toLowerCase(); const reason = str(fd, "reason").slice(0, LIMITS.reason);
  if (!reason) return { error: "Give a reason. The student will see it." };
  const u = getDb().prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (!u) return { error: "No student with that email." };
  let name: string | null;
  try { name = suspend(u.id, reason); } catch (e) { return { error: (e as Error).message }; }
  logAdmin(admin, "Account paused", name ?? email, reason);
  revalidatePath("/admin/reports");
  return { ok: true, message: `${name} is paused.` };
}

export async function unsuspendUser(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("user_id"));
  const db = getDb();
  const u = db.prepare("SELECT name FROM users WHERE id = ? AND suspended_at IS NOT NULL").get(id) as { name: string } | undefined;
  if (u) {
    db.prepare("UPDATE users SET suspended_at = NULL, suspended_reason = NULL WHERE id = ?").run(id);
    notify(id, "Your account is active again", "An organiser has un-paused your account. Welcome back.", "/rules");
    logAdmin(admin, "Account un-paused", u.name);
  }
  revalidatePath("/admin/reports");
}
