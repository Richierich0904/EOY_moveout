import { getDb } from "./db";
import { listingMatchesSearch } from "./listings";

export type Want = {
  id: number; user_id: number; title: string; description: string; category: string;
  max_price_cents: number | null; status: "open" | "fulfilled"; created_at: string;
  user_name: string; user_house: string; user_grad_year: number;
};

export function listWants(opts: { userId?: number; status?: "open" | "all"; q?: string } = {}): Want[] {
  const where: string[] = []; const params: unknown[] = [];
  if (opts.status !== "all") where.push("w.status = 'open'");
  if (opts.userId) { where.push("w.user_id = ?"); params.push(opts.userId); }
  if (opts.q) { where.push("(w.title LIKE ? OR w.description LIKE ?)"); params.push(`%${opts.q}%`, `%${opts.q}%`); }
  return getDb().prepare(
    `SELECT w.*, u.name AS user_name, u.house AS user_house, u.grad_year AS user_grad_year
     FROM wants w JOIN users u ON u.id = w.user_id ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY w.created_at DESC LIMIT 200`).all(...params) as Want[];
}

export function getWant(id: number): Want | null {
  return (getDb().prepare(
    `SELECT w.*, u.name AS user_name, u.house AS user_house, u.grad_year AS user_grad_year
     FROM wants w JOIN users u ON u.id = w.user_id WHERE w.id = ?`).get(id) as Want | undefined) ?? null;
}

// ---------- notifications ----------

export function notify(userId: number, title: string, body: string, link: string) {
  getDb().prepare("INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)").run(userId, title, body, link);
  // Hook for email/push: wire an SMTP or push provider here.
  if (process.env.NODE_ENV !== "production") console.log(`[notify] user ${userId}: ${title} — ${body} (${link})`);
}

export function unreadCounts(userId: number) {
  const db = getDb();
  const n = (db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0").get(userId) as { c: number }).c;
  const m = (db.prepare(
    `SELECT COUNT(*) c FROM messages m JOIN threads t ON t.id = m.thread_id
     WHERE m.read_at IS NULL AND m.sender_id != ? AND (t.user_a = ? OR t.user_b = ?)`).get(userId, userId, userId) as { c: number }).c;
  return { notifications: n, messages: m };
}

/** After a listing is created: alert everyone whose saved search or open want matches it. */
export function fanOutNewListing(listingId: number) {
  const db = getDb();
  const l = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId) as {
    id: number; user_id: number; title: string; description: string; category: string; price_cents: number; course_code: string | null;
  };
  const link = `/listings/${l.id}`;
  const alerted = new Set<number>();

  const searches = db.prepare("SELECT * FROM saved_searches WHERE user_id != ?").all(l.user_id) as {
    id: number; user_id: number; query: string; category: string | null; free_only: number; max_price_cents: number | null;
  }[];
  for (const s of searches) {
    if (alerted.has(s.user_id) || !listingMatchesSearch(l, s)) continue;
    alerted.add(s.user_id);
    notify(s.user_id, "New listing matches your alert", `${l.title} was just listed${s.query ? ` (search: "${s.query}")` : ""}.`, link);
  }

  // Wanted posts: match on category plus shared keywords in the title.
  const wants = db.prepare("SELECT id, user_id, title, category, max_price_cents FROM wants WHERE status = 'open' AND user_id != ?").all(l.user_id) as {
    id: number; user_id: number; title: string; category: string; max_price_cents: number | null;
  }[];
  const words = new Set(l.title.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  for (const w of wants) {
    if (alerted.has(w.user_id)) continue;
    if (w.category !== l.category) continue;
    if (w.max_price_cents !== null && l.price_cents > w.max_price_cents) continue;
    const overlap = w.title.toLowerCase().split(/\W+/).some((t) => t.length > 2 && words.has(t));
    if (!overlap) continue;
    alerted.add(w.user_id);
    notify(w.user_id, "Someone listed what you wanted", `"${l.title}" might match your wanted post "${w.title}".`, link);
  }
}

// ---------- messaging ----------

export type Thread = {
  id: number; listing_id: number | null; want_id: number | null; user_a: number; user_b: number;
  last_message_at: string; other_id: number; other_name: string; subject: string; last_body: string | null; unread: number;
};

export function listThreads(userId: number): Thread[] {
  return getDb().prepare(
    `SELECT t.*, o.id AS other_id, o.name AS other_name,
       COALESCE(l.title, 'Wanted: ' || w.title, 'Conversation') AS subject,
       (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_body,
       (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id AND m.read_at IS NULL AND m.sender_id != ?) AS unread
     FROM threads t
     JOIN users o ON o.id = CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END
     LEFT JOIN listings l ON l.id = t.listing_id
     LEFT JOIN wants w ON w.id = t.want_id
     WHERE t.user_a = ? OR t.user_b = ?
     ORDER BY t.last_message_at DESC`).all(userId, userId, userId, userId) as Thread[];
}

export function getThread(threadId: number, userId: number): Thread | null {
  return (getDb().prepare(
    `SELECT t.*, o.id AS other_id, o.name AS other_name,
       COALESCE(l.title, 'Wanted: ' || w.title, 'Conversation') AS subject, NULL AS last_body, 0 AS unread
     FROM threads t
     JOIN users o ON o.id = CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END
     LEFT JOIN listings l ON l.id = t.listing_id
     LEFT JOIN wants w ON w.id = t.want_id
     WHERE t.id = ? AND (t.user_a = ? OR t.user_b = ?)`).get(userId, threadId, userId, userId) as Thread | undefined) ?? null;
}

export function getOrCreateThread(opts: { listingId?: number; wantId?: number; me: number; other: number }) {
  const db = getDb();
  const [a, b] = opts.me < opts.other ? [opts.me, opts.other] : [opts.other, opts.me];
  const existing = db.prepare(
    "SELECT id FROM threads WHERE COALESCE(listing_id,0) = ? AND COALESCE(want_id,0) = ? AND user_a = ? AND user_b = ?")
    .get(opts.listingId ?? 0, opts.wantId ?? 0, a, b) as { id: number } | undefined;
  if (existing) return existing.id;
  const r = db.prepare("INSERT INTO threads (listing_id, want_id, user_a, user_b) VALUES (?, ?, ?, ?)")
    .run(opts.listingId ?? null, opts.wantId ?? null, a, b);
  return Number(r.lastInsertRowid);
}

export type Message = { id: number; thread_id: number; sender_id: number; body: string; created_at: string; sender_name: string };

export function getMessages(threadId: number): Message[] {
  return getDb().prepare(
    "SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.thread_id = ? ORDER BY m.created_at, m.id")
    .all(threadId) as Message[];
}

export function markThreadRead(threadId: number, userId: number) {
  getDb().prepare("UPDATE messages SET read_at = datetime('now') WHERE thread_id = ? AND sender_id != ? AND read_at IS NULL").run(threadId, userId);
}
