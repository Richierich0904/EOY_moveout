// Small rate limiter backed by the database, so limits survive a restart.

import { getDb } from "./db";

/** How many times `key` was recorded in the last `seconds`. */
export function hits(key: string, seconds: number): number {
  return (getDb().prepare("SELECT COUNT(*) c FROM rate_events WHERE key = ? AND created_at > datetime('now', ?)").get(key, `-${seconds} seconds`) as { c: number }).c;
}

export function record(key: string) {
  getDb().prepare("INSERT INTO rate_events (key) VALUES (?)").run(key);
}

export function clear(key: string) {
  getDb().prepare("DELETE FROM rate_events WHERE key = ?").run(key);
}

/** Old events are only needed for the longest window (one day). */
export function pruneRateEvents() {
  getDb().prepare("DELETE FROM rate_events WHERE created_at < datetime('now', '-2 days')").run();
}
