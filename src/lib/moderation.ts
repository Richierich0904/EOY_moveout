// Keeping the site safe: reports, blocks, held posts, paused accounts, and a log of what organisers do.

import { getDb } from "./db";
import { ADMIN_EMAILS, BANNED_WORDS } from "./config";
import { likePattern } from "./listings";
import { notify } from "./social";
import { describeHold } from "./judge";

export const REPORT_REASONS = [
  "Not allowed at school",
  "Unkind or bullying",
  "Unfair or dishonest",
  "Makes me uncomfortable",
  "Something else",
] as const;

export type TargetType = "listing" | "want" | "thread" | "user";
export const TARGET_TYPES: TargetType[] = ["listing", "want", "thread", "user"];

// ---------- blocks ----------

/** True when either student has blocked the other. */
export function isBlocked(a: number, b: number) {
  return !!getDb().prepare("SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)").get(a, b, b, a);
}

export function iBlocked(me: number, other: number) {
  return !!getDb().prepare("SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?").get(me, other);
}

export function myBlocks(me: number) {
  return getDb().prepare("SELECT u.id, u.name FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ? ORDER BY u.name").all(me) as { id: number; name: string }[];
}

// ---------- screening ----------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BANNED_RE = BANNED_WORDS.length ? new RegExp(`\\b(${BANNED_WORDS.map(escapeRe).join("|")})\\b`, "i") : null;

/** The first not-allowed word in a post, or null. Posts that match are held for an organiser to look at. */
export function screenText(...texts: (string | null | undefined)[]): string | null {
  if (!BANNED_RE) return null;
  const m = BANNED_RE.exec(texts.filter(Boolean).join(" \n "));
  return m ? m[1].toLowerCase() : null;
}

// ---------- organisers ----------

export function adminIds(): number[] {
  if (ADMIN_EMAILS.length === 0) return [];
  const rows = getDb().prepare(`SELECT id FROM users WHERE verified = 1 AND lower(email) IN (${ADMIN_EMAILS.map(() => "?").join(",")})`).all(...ADMIN_EMAILS) as { id: number }[];
  return rows.map((r) => r.id);
}

export function notifyAdmins(title: string, body: string, link: string) {
  for (const id of adminIds()) notify(id, title, body, link);
}

export function logAdmin(admin: { id: number; name: string }, action: string, target = "", note = "") {
  getDb().prepare("INSERT INTO admin_log (admin_id, admin_name, action, target, note) VALUES (?, ?, ?, ?, ?)").run(admin.id, admin.name, action, target, note);
}

/** Like logAdmin, but the same organiser doing the same thing to the same target is only written once every ten minutes. */
export function logAdminOnce(admin: { id: number; name: string }, action: string, target = "", note = "") {
  const seen = getDb().prepare("SELECT 1 FROM admin_log WHERE admin_id = ? AND action = ? AND target = ? AND note = ? AND created_at > datetime('now', '-10 minutes')").get(admin.id, action, target, note);
  if (!seen) logAdmin(admin, action, target, note);
}

export function recentLog(limit = 30) {
  return getDb().prepare("SELECT id, admin_name, action, target, note, created_at FROM admin_log ORDER BY id DESC LIMIT ?").all(limit) as
    { id: number; admin_name: string; action: string; target: string; note: string; created_at: string }[];
}

// ---------- reports ----------

export type Target = { label: string; link: string | null; ownerId: number | null; ownerName: string | null; text: string };

/** What a report points at: a short label, where to look, and whose it is. */
export function describeTarget(type: TargetType, id: number, reporterId?: number): Target | null {
  const db = getDb();
  if (type === "listing") {
    const r = db.prepare("SELECT l.title, l.description, l.status, u.id AS uid, u.name FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?").get(id) as
      { title: string; description: string; status: string; uid: number; name: string } | undefined;
    return r ? { label: `Listing: ${r.title}${r.status === "removed" ? " (removed)" : ""}`, link: `/listings/${id}`, ownerId: r.uid, ownerName: r.name, text: r.description } : null;
  }
  if (type === "want") {
    const r = db.prepare("SELECT w.title, w.description, w.status, u.id AS uid, u.name FROM wants w JOIN users u ON u.id = w.user_id WHERE w.id = ?").get(id) as
      { title: string; description: string; status: string; uid: number; name: string } | undefined;
    return r ? { label: `Wanted post: ${r.title}${r.status === "removed" ? " (removed)" : ""}`, link: `/wanted/${id}`, ownerId: r.uid, ownerName: r.name, text: r.description } : null;
  }
  if (type === "user") {
    const r = db.prepare("SELECT id, name FROM users WHERE id = ?").get(id) as { id: number; name: string } | undefined;
    return r ? { label: `Student: ${r.name}`, link: `/u/${id}`, ownerId: r.id, ownerName: r.name, text: "" } : null;
  }
  const t = db.prepare("SELECT t.user_a, t.user_b, a.name AS a_name, b.name AS b_name FROM threads t JOIN users a ON a.id = t.user_a JOIN users b ON b.id = t.user_b WHERE t.id = ?").get(id) as
    { user_a: number; user_b: number; a_name: string; b_name: string } | undefined;
  if (!t) return null;
  // The report is about the other person in the chat.
  const other = reporterId === t.user_a ? { id: t.user_b, name: t.b_name } : reporterId === t.user_b ? { id: t.user_a, name: t.a_name } : null;
  return { label: `Chat between ${t.a_name} and ${t.b_name}`, link: `/admin/messages/${id}`, ownerId: other?.id ?? null, ownerName: other?.name ?? null, text: "" };
}

export type ReportRow = {
  id: number; reporter_id: number; reporter_name: string; target_type: TargetType; target_id: number; reason: string; details: string;
  status: "open" | "resolved"; resolution: string | null; created_at: string; resolved_at: string | null; target: Target | null;
};

export function listReports(status: "open" | "resolved", limit = 50): ReportRow[] {
  const rows = getDb().prepare(
    `SELECT r.*, u.name AS reporter_name FROM reports r JOIN users u ON u.id = r.reporter_id WHERE r.status = ? ORDER BY r.id DESC LIMIT ?`).all(status, limit) as Omit<ReportRow, "target">[];
  return rows.map((r) => ({ ...r, target: describeTarget(r.target_type, r.target_id, r.reporter_id) }));
}

export function openReportCount() {
  return (getDb().prepare("SELECT COUNT(*) c FROM reports WHERE status = 'open'").get() as { c: number }).c;
}

// ---------- held posts and paused accounts ----------

export type Held = {
  type: "listing" | "want" | "avatar"; id: number; title: string; description: string; owner_id: number; owner_name: string; created_at: string;
  /** "Word list" or "AI judge", and what it noticed. */
  by: string; why: string;
  /** Photos an organiser should see before deciding. */
  photos: string[];
};

export function heldPosts(): Held[] {
  const db = getDb();
  type Row = Omit<Held, "by" | "why" | "photos"> & { held_reason: string | null };
  const l = db.prepare("SELECT 'listing' AS type, l.id, l.title, l.description, u.id AS owner_id, u.name AS owner_name, l.created_at, l.held_reason FROM listings l JOIN users u ON u.id = l.user_id WHERE l.status = 'review' ORDER BY l.id").all() as Row[];
  const w = db.prepare("SELECT 'want' AS type, w.id, w.title, w.description, u.id AS owner_id, u.name AS owner_name, w.created_at, w.held_reason FROM wants w JOIN users u ON u.id = w.user_id WHERE w.status = 'review' ORDER BY w.id").all() as Row[];
  const a = db.prepare("SELECT 'avatar' AS type, id, 'New profile photo' AS title, '' AS description, id AS owner_id, name AS owner_name, created_at, avatar_held_reason AS held_reason, avatar_pending FROM users WHERE avatar_pending IS NOT NULL ORDER BY id").all() as (Row & { avatar_pending: string })[];
  const photosOf = db.prepare("SELECT file FROM listing_images WHERE listing_id = ? ORDER BY position");
  return [...l, ...w, ...a].map((h) => {
    // Posts held before reasons were stored fall back to looking the word up again.
    const word = h.held_reason ? null : screenText(h.title, h.description);
    const hold = describeHold(h.held_reason ?? (word ? `words|${word}` : null));
    const photos = h.type === "listing" ? (photosOf.all(h.id) as { file: string }[]).map((r) => r.file)
      : h.type === "avatar" ? [(h as Row & { avatar_pending: string }).avatar_pending] : [];
    return { type: h.type, id: h.id, title: h.title, description: h.description, owner_id: h.owner_id, owner_name: h.owner_name, created_at: h.created_at, by: hold.by, why: hold.organiser, photos };
  });
}

export function heldCount() {
  return (getDb().prepare("SELECT (SELECT COUNT(*) FROM listings WHERE status = 'review') + (SELECT COUNT(*) FROM wants WHERE status = 'review') + (SELECT COUNT(*) FROM users WHERE avatar_pending IS NOT NULL) AS c").get() as { c: number }).c;
}

export function suspendedUsers() {
  return getDb().prepare("SELECT id, name, email, house, suspended_at, suspended_reason FROM users WHERE suspended_at IS NOT NULL ORDER BY suspended_at DESC").all() as
    { id: number; name: string; email: string; house: string; suspended_at: string; suspended_reason: string | null }[];
}

// ---------- reading chats ----------

export type AdminThread = { id: number; a_id: number; a_name: string; b_id: number; b_name: string; subject: string; messages: number; last_message_at: string; last_body: string | null };

const ADMIN_THREAD_SELECT = `
  SELECT t.id, a.id AS a_id, a.name AS a_name, b.id AS b_id, b.name AS b_name, t.last_message_at,
    COALESCE(l.title, 'Wanted: ' || w.title, 'Conversation') AS subject,
    (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) AS messages,
    (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_body
  FROM threads t JOIN users a ON a.id = t.user_a JOIN users b ON b.id = t.user_b
  LEFT JOIN listings l ON l.id = t.listing_id LEFT JOIN wants w ON w.id = t.want_id`;

/** Every conversation on the site, newest first. `q` matches a student's name or email, or words in a message. */
export function adminThreads(q?: string, limit = 60): AdminThread[] {
  if (q?.trim()) {
    const like = likePattern(q);
    return getDb().prepare(
      `${ADMIN_THREAD_SELECT} WHERE a.name LIKE ? ESCAPE '\\' OR b.name LIKE ? ESCAPE '\\' OR a.email LIKE ? ESCAPE '\\' OR b.email LIKE ? ESCAPE '\\'
         OR EXISTS (SELECT 1 FROM messages m WHERE m.thread_id = t.id AND m.body LIKE ? ESCAPE '\\')
       ORDER BY t.last_message_at DESC LIMIT ?`).all(like, like, like, like, like, limit) as AdminThread[];
  }
  return getDb().prepare(`${ADMIN_THREAD_SELECT} ORDER BY t.last_message_at DESC LIMIT ?`).all(limit) as AdminThread[];
}

export function adminThread(id: number): AdminThread | null {
  return (getDb().prepare(`${ADMIN_THREAD_SELECT} WHERE t.id = ?`).get(id) as AdminThread | undefined) ?? null;
}
