// Background chores that have no server of their own to run on.
// The layout calls this on every page view, but the work only happens every few minutes.

import { getDb } from "./db";
import { settleRankings } from "./progress";
import { runDueDraws } from "./game";
import { pruneRateEvents } from "./limits";
import { UNVERIFIED_DAYS } from "./config";

const EVERY_MS = 5 * 60_000;

declare global {
  var __lastHousekeeping: number | undefined;
}

export function housekeeping(force = false) {
  const now = Date.now();
  if (!force && global.__lastHousekeeping && now - global.__lastHousekeeping < EVERY_MS) return;
  global.__lastHousekeeping = now;
  try {
    settleRankings();
    runDueDraws();
    getDb().prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
    // Sign-ups that never entered their code don't linger.
    getDb().prepare("DELETE FROM users WHERE verified = 0 AND created_at < datetime('now', ?)").run(`-${UNVERIFIED_DAYS} days`);
    pruneRateEvents();
  } catch (e) {
    console.error("[housekeeping]", e);
  }
}
