// Personal progress: points, weekly / monthly / school-year rankings, automatic prizes,
// streaks and badge progress.
//
// Points only come from handoffs the other person confirmed ("Yes, I received it"),
// so nobody can climb the rankings by marking their own listings as gone.
// All periods are in UTC: weeks start Monday, school years start 1 August.

import { getDb } from "./db";
import { BADGES, POINTS_GIVEAWAY, POINTS_SALE, RANK_PRIZES, categoryKg } from "./config";
import { addCredits } from "./game";
import { notify } from "./social";

export type Period = "week" | "month" | "year";
export const PERIODS: Period[] = ["week", "month", "year"];

const CONFIRMED = "l.status = 'sold' AND l.received_at IS NOT NULL AND l.buyer_id IS NOT NULL AND l.buyer_id != l.user_id";
const POINTS_SQL = `SUM(CASE WHEN l.price_cents = 0 THEN ${POINTS_GIVEAWAY} ELSE ${POINTS_SALE} END)`;

// ---------- periods ----------

const pad = (n: number) => String(n).padStart(2, "0");
/** SQLite's datetime('now') format, so string comparison works. */
const sqlTime = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

export type Window = { period: Period; key: string; start: Date; end: Date; label: string };

/** The period that contains `at`, shifted back by `back` periods. */
export function periodWindow(period: Period, back = 0, at = new Date()): Window {
  const y = at.getUTCFullYear(), m = at.getUTCMonth(), d = at.getUTCDate();
  if (period === "week") {
    const monday = new Date(Date.UTC(y, m, d - ((at.getUTCDay() + 6) % 7) - 7 * back));
    const end = new Date(monday.getTime() + 7 * 86400_000);
    const label = `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
    return { period, key: monday.toISOString().slice(0, 10), start: monday, end, label };
  }
  if (period === "month") {
    const start = new Date(Date.UTC(y, m - back, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { period, key: start.toISOString().slice(0, 7), start, end, label: start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) };
  }
  const first = (m >= 7 ? y : y - 1) - back;
  const start = new Date(Date.UTC(first, 7, 1));
  const end = new Date(Date.UTC(first + 1, 7, 1));
  return { period, key: `${first}-${String(first + 1).slice(2)}`, start, end, label: `School year ${first}–${String(first + 1).slice(2)}` };
}

// ---------- rankings ----------

export type RankRow = { user_id: number; name: string; house: string; avatar: string | null; points: number; items: number; given: number; rank: number };

/** Everyone with points in the window, best first. Tied scores share a rank. */
export function ranking(w: Window): RankRow[] {
  const rows = getDb().prepare(
    `SELECT l.user_id, u.name, u.house, u.avatar, ${POINTS_SQL} AS points, COUNT(*) AS items,
       SUM(CASE WHEN l.price_cents = 0 THEN 1 ELSE 0 END) AS given
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE ${CONFIRMED} AND l.received_at >= ? AND l.received_at < ?
     GROUP BY l.user_id ORDER BY points DESC, given DESC, u.name`).all(sqlTime(w.start), sqlTime(w.end)) as Omit<RankRow, "rank">[];
  return rows.map((r) => ({ ...r, rank: 1 + rows.filter((o) => o.points > r.points).length }));
}

export type MyRank = { window: Window; rank: number | null; points: number; of: number; gap: { name: string; points: number } | null; prize: number };

/** Where one person stands in the current week, month and school year. */
export function myRanks(userId: number): MyRank[] {
  return PERIODS.map((p) => {
    const w = periodWindow(p);
    const list = ranking(w);
    const me = list.find((r) => r.user_id === userId);
    const ahead = me ? [...list].reverse().find((r) => r.points > me.points) : list[list.length - 1];
    return {
      window: w, rank: me?.rank ?? null, points: me?.points ?? 0, of: list.length,
      gap: ahead ? { name: ahead.name.split(" ")[0], points: ahead.points - (me?.points ?? 0) + 1 } : null,
      prize: RANK_PRIZES[p][0] ?? 0,
    };
  });
}

// ---------- prizes ----------

/** Close out finished weeks, months and school years: pay the top finishers once, and tell them.
 *  Cheap to call on every request: a finished period is only ranked if it has no awards yet. */
export function settleRankings() {
  const db = getDb();
  const done = db.prepare("SELECT 1 FROM awards WHERE period = ? AND period_key = ? LIMIT 1");
  const ins = db.prepare("INSERT OR IGNORE INTO awards (period, period_key, place, user_id, points, credit_cents) VALUES (?, ?, ?, ?, ?, ?)");
  const lookback: Record<Period, number> = { week: 8, month: 6, year: 2 };
  for (const p of PERIODS) {
    for (let back = 1; back <= lookback[p]; back++) {
      const w = periodWindow(p, back);
      if (done.get(p, w.key)) continue;
      const winners = ranking(w).filter((r) => r.rank <= RANK_PRIZES[p].length);
      if (winners.length === 0) continue;
      db.transaction(() => {
        for (const r of winners) {
          const credits = RANK_PRIZES[p][r.rank - 1] ?? 0;
          const res = ins.run(p, w.key, r.rank, r.user_id, r.points, credits);
          if (res.changes === 0) continue;
          if (credits > 0) addCredits(r.user_id, credits, `Ranking prize: #${r.rank}, ${w.label}`);
          notify(r.user_id, `You finished #${r.rank} · ${w.label}`,
            `${r.points} points from ${r.items} handoff${r.items === 1 ? "" : "s"}.${credits ? ` ${credits / 100} credits are in your balance.` : ""}`, "/me");
        }
      })();
    }
  }
}

export type Award = { id: number; period: Period; period_key: string; place: number; points: number; credit_cents: number; created_at: string };

export function awardsFor(userId: number): (Award & { label: string })[] {
  const rows = getDb().prepare("SELECT * FROM awards WHERE user_id = ? ORDER BY created_at DESC, id DESC").all(userId) as Award[];
  return rows.map((a) => ({ ...a, label: labelForKey(a.period, a.period_key) }));
}

function labelForKey(p: Period, key: string) {
  if (p === "week") return `Week of ${new Date(key + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
  if (p === "month") return new Date(key + "-01T00:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return `School year ${key}`;
}

// ---------- personal stats ----------

export type WeekBar = { key: string; label: string; points: number; current: boolean };

/** Points per week for the last `weeks` weeks, oldest first. */
export function weeklyPoints(userId: number, weeks = 12): WeekBar[] {
  const from = periodWindow("week", weeks - 1);
  const rows = getDb().prepare(
    `SELECT l.received_at, l.price_cents FROM listings l WHERE l.user_id = ? AND ${CONFIRMED} AND l.received_at >= ?`)
    .all(userId, sqlTime(from.start)) as { received_at: string; price_cents: number }[];
  const bars: WeekBar[] = Array.from({ length: weeks }, (_, i) => {
    const w = periodWindow("week", weeks - 1 - i);
    return { key: w.key, label: w.start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), points: 0, current: i === weeks - 1 };
  });
  for (const r of rows) {
    const t = new Date(r.received_at.replace(" ", "T") + "Z").getTime();
    const i = Math.floor((t - from.start.getTime()) / (7 * 86400_000));
    if (i >= 0 && i < weeks) bars[i].points += r.price_cents === 0 ? POINTS_GIVEAWAY : POINTS_SALE;
  }
  return bars;
}

/** Consecutive weeks with at least one confirmed handoff, counting back from this week
 *  (or from last week, so a streak isn't broken before this week is over). */
export function streak(userId: number): number {
  const bars = weeklyPoints(userId, 26);
  let i = bars.length - 1;
  if (bars[i].points === 0) i--;
  let n = 0;
  while (i >= 0 && bars[i].points > 0) { n++; i--; }
  return n;
}

export type Totals = { points: number; handoffs: number; given: number; sold: number; earned: number; kg: number; streak: number };

export function personalTotals(userId: number): Totals {
  const rows = getDb().prepare(`SELECT l.price_cents, l.category FROM listings l WHERE l.user_id = ? AND ${CONFIRMED}`).all(userId) as { price_cents: number; category: string }[];
  const given = rows.filter((r) => r.price_cents === 0).length;
  return {
    points: given * POINTS_GIVEAWAY + (rows.length - given) * POINTS_SALE,
    handoffs: rows.length, given, sold: rows.length - given,
    earned: rows.reduce((a, r) => a + r.price_cents, 0),
    kg: rows.reduce((a, r) => a + categoryKg(r.category), 0),
    streak: streak(userId),
  };
}

// ---------- badges ----------

export type BadgeState = (typeof BADGES)[number] & { have: number; need: number; earned: boolean };

/** Every badge, with how close this person is to it. */
export function badgeProgress(userId: number): BadgeState[] {
  const db = getDb();
  const n = (sql: string) => (db.prepare(sql).get(userId) as { c: number }).c;
  const given = n(`SELECT COUNT(*) c FROM listings l WHERE l.user_id = ? AND ${CONFIRMED} AND l.price_cents = 0`);
  const rehomed = n("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold'");
  const books = n("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold' AND category = 'textbooks'");
  const summer = n("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold' AND handoff = 'fall'");
  const won = n("SELECT COUNT(*) c FROM prizes WHERE winner_id = ?");
  const weekly = n("SELECT COUNT(*) c FROM awards WHERE user_id = ? AND period = 'week' AND place = 1");
  const monthly = n("SELECT COUNT(*) c FROM awards WHERE user_id = ? AND period = 'month'");
  const yearly = n("SELECT COUNT(*) c FROM awards WHERE user_id = ? AND period = 'year'");
  const progress: Record<string, [number, number]> = {
    giver: [given, 1], generous: [given, 5], rehomer: [rehomed, 10], bookworm: [books, 3], summer: [summer, 1],
    lucky: [won, 1], early: [userId <= 50 ? 1 : 0, 1], streak: [streak(userId), 3],
    weekly: [weekly, 1], monthly: [monthly, 1], yearly: [yearly, 1],
  };
  return BADGES.map((b) => {
    const [have, need] = progress[b.slug] ?? [0, 1];
    return { ...b, have: Math.min(have, need), need, earned: have >= need };
  });
}

/** Just the badges someone has earned, for compact displays. */
export function badgesFor(userId: number) {
  return badgeProgress(userId).filter((b) => b.earned);
}
