import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  house TEXT NOT NULL,
  grad_year INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  verify_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'Good',
  course_code TEXT,
  handoff TEXT NOT NULL DEFAULT 'now',
  spot TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  buyer_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS wants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  max_price_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  want_id INTEGER REFERENCES wants(id) ON DELETE SET NULL,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_message_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_threads_unique ON threads(
  COALESCE(listing_id, 0), COALESCE(want_id, 0), user_a, user_b
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at);
CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL DEFAULT '',
  category TEXT,
  free_only INTEGER NOT NULL DEFAULT 0,
  max_price_cents INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '/',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE TABLE IF NOT EXISTS draws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL DEFAULT (datetime('now')),
  ends_at TEXT NOT NULL,
  drawn_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draw_id INTEGER NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  winner_id INTEGER REFERENCES users(id),
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS credit_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_credit_user ON credit_transactions(user_id);
CREATE TABLE IF NOT EXISTS awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  period_key TEXT NOT NULL,
  place INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (period, period_key, place, user_id)
);
CREATE INDEX IF NOT EXISTS idx_awards_user ON awards(user_id);
CREATE TABLE IF NOT EXISTS settled_periods (
  period TEXT NOT NULL,
  period_key TEXT NOT NULL,
  PRIMARY KEY (period, period_key)
);
CREATE TABLE IF NOT EXISTS rate_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rate_events ON rate_events(key, created_at);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE TABLE IF NOT EXISTS judge_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  decision TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'none',
  reason TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_judge_log_created ON judge_log(created_at);
CREATE TABLE IF NOT EXISTS admin_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// Columns added after the first release. Each ALTER is skipped if the column already exists.
const MIGRATIONS: [table: string, column: string, ddl: string][] = [
  ["listings", "accepts_credits", "INTEGER NOT NULL DEFAULT 0"],
  ["listings", "credit_paid_cents", "INTEGER NOT NULL DEFAULT 0"],
  ["listings", "received_at", "TEXT"],
  ["users", "avatar", "TEXT"],
  // sign-in safety
  ["users", "verify_expires_at", "TEXT"],
  ["users", "verify_attempts", "INTEGER NOT NULL DEFAULT 0"],
  ["users", "verify_sent_at", "TEXT"],
  ["users", "reset_code", "TEXT"],
  ["users", "reset_expires_at", "TEXT"],
  ["users", "reset_attempts", "INTEGER NOT NULL DEFAULT 0"],
  // moderation
  ["users", "suspended_at", "TEXT"],
  ["users", "suspended_reason", "TEXT"],
  ["users", "rules_accepted_at", "TEXT"],
  ["users", "hide_from_rankings", "INTEGER NOT NULL DEFAULT 0"],
  ["listings", "removed_reason", "TEXT"],
  ["wants", "removed_reason", "TEXT"],
  // boosts and fair play
  ["listings", "boosted_until", "TEXT"],
  ["listings", "counted", "INTEGER NOT NULL DEFAULT 1"],
  // why a post or photo is being held for an organiser (word list or AI judge)
  ["listings", "held_reason", "TEXT"],
  ["wants", "held_reason", "TEXT"],
  ["users", "avatar_pending", "TEXT"],
  ["users", "avatar_held_reason", "TEXT"],
];

declare global {
  var __db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__db) return global.__db;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  for (const [table, column, ddl] of MIGRATIONS) {
    const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
    if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
  // Indexes on migrated columns can only be created once the columns exist.
  db.exec("CREATE INDEX IF NOT EXISTS idx_listings_received ON listings(received_at)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_listings_buyer ON listings(buyer_id)");
  // Older sessions stored their expiry in ISO format, which SQLite compares wrongly against datetime('now').
  db.exec("UPDATE sessions SET expires_at = replace(substr(expires_at, 1, 19), 'T', ' ') WHERE expires_at LIKE '%T%'");
  global.__db = db;
  return db;
}
