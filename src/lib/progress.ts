// Personal progress: points, weekly / monthly / school-year rankings, automatic prizes,
// streaks and badge progress.
//
// Points only come from handoffs the other person confirmed ("Yes, I received it") and that
// fall within the fair-play limits (`counted`), so nobody can climb by marking their own
// listings as gone or by passing things back and forth with a friend.
// All periods follow the school's clock: weeks start Monday, school years start 1 August.

import { getDb } from "./db";
import { BADGES, POINTS_GIVEAWAY, POINTS_SALE, RANK_PRIZES, categoryKg } from "./config";
import { addCredits } from "./game";
import { notify } from "./social";
import { parseSql, sqlTime, zonedParts, zonedToUtc } from "./time";

export type Period = "week" | "month" | "year";
export const PERIODS: Period[] = ["week", "month", "year"];

const CONFIRMED = "l.status = 'sold' AND l.received_at IS NOT NULL AND l.counted = 1";
const POINTS_SQL = `SUM(CASE WHEN l.price_cents = 0 THEN ${POINTS_GIVEAWAY} ELSE ${POINTS_SALE} END)`;

// ---------- periods ----------

export type Window = { period: Period; key: string; start: Date; end: Date; label: string };

/** A calendar date with no time zone attached, for keys and labels. */
const cal = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const calLabel = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

/** The period that contains `at` (school time), shifted back by `back` periods. */
export function periodWindow(period: Period, back = 0, at = new Date()): Window {
  const { y, m, d, dow } = zonedParts(at);
  if (period === "week") {
    const day = d - ((dow + 6) % 7) - 7 * back;
    const monday = cal(y, m, day);
    return { period, key: monday.toISOString().slice(0, 10), start: zonedToUtc(y, m, day), end: zonedToUtc(y, m, day + 7), label: `Week of ${calLabel(monday, { month: "short", day: "numeric" })}` };
  }
  if (period === "month") {
    const first = cal(y, m - back, 1);
    return { period, key: first.toISOString().slice(0, 7), start: zonedToUtc(y, m - back, 1), end: zonedToUtc(y, m - back + 1, 1), label: calLabel(first, { month: "long", year: "numeric" }) };
  }
  const first = (m >= 7 ? y : y - 1) - back;
  return { period, key: `${first}-${String(first + 1).slice(2)}`, start: zonedToUtc(first, 7, 1), end: zonedToUtc(first + 1, 7, 1), label: `School year ${first}–${String(first + 1).slice(2)}` };
}

// ---------- rankings ----------

export type RankRow = { user_id: number; name: string; house: string; avatar: string | null; points: number; items: number; given: number; rank: number };

/** Everyone with points in the window, best first. Tied scores share a rank.
 *  Students who chose to hide from the rankings, and paused accounts, are left out. */
export function ranking(w: Window): RankRow[] {
  const rows = getDb().prepare(
    `SELECT l.user_id, u.name, u.house, u.avatar, ${POINTS_SQL} AS points, COUNT(*) AS items,
       SUM(CASE WHEN l.price_cents = 0 THEN 1 ELSE 0 END) AS given
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE ${CONFIRMED} AND u.hide_from_rankings = 0 AND u.suspended_at IS NULL AND l.received_at >= ? AND l.received_at < ?
     GROUP BY l.user_id ORDER BY points DESC, given DESC, u.name`).all(sqlTime(w.start), sqlTime(w.end)) as Omit<RankRow, "rank">[];
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.points < rows[i - 1].points) rank = i + 1;
    return { ...r, rank };
  });
}

/** Who wins what. Students tied on a place share the prizes for the places they take up,
 *  rounded down to whole credits, instead of each getting the full prize. */
export function prizeShares(list: RankRow[], prizes: number[]): Map<number, number> {
  const out = new Map<number, number>();
  for (let i = 0; i < list.length && list[i].rank <= prizes.length;) {
    const tied = list.filter((r) => r.rank === list[i].rank);
    const pool = prizes.slice(list[i].rank - 1, list[i].rank - 1 + tied.length).reduce((a, c) => a + c, 0);
    const each = Math.floor(pool / tied.length / 100) * 100;
    for (const r of tied) out.set(r.user_id, each);
    i += tied.length;
  }
  return out;
}

function pointsInWindow(userId: number, w: Window) {
  return (getDb().prepare(`SELECT COALESCE(${POINTS_SQL}, 0) AS p FROM listings l WHERE l.user_id = ? AND ${CONFIRMED} AND l.received_at >= ? AND l.received_at < ?`)
    .get(userId, sqlTime(w.start), sqlTime(w.end)) as { p: number }).p;
}

export type MyRank = { window: Window; rank: number | null; points: number; of: number; gap: number | null; prize: number };

/** Where one person stands in the current week, month and school year.
 *  `gap` is how many more points move them up a place. It never names anyone. */
export function myRanks(userId: number): MyRank[] {
  return PERIODS.map((p) => {
    const w = periodWindow(p);
    const list = ranking(w);
    const me = list.find((r) => r.user_id === userId);
    const points = me?.points ?? pointsInWindow(userId, w);
    const ahead = me ? [...list].reverse().find((r) => r.points > me.points) : list[list.length - 1];
    return {
      window: w, rank: me?.rank ?? null, points, of: list.length,
      gap: ahead ? Math.max(1, ahead.points - points + 1) : null,
      prize: RANK_PRIZES[p][0] ?? 0,
    };
  });
}

// ---------- prizes ----------

/** Close out finished weeks, months and school years: pay the top finishers once, and tell them.
 *  Every finished period is recorded in settled_periods, winners or not, so it is only worked out once. */
export function settleRankings() {
  const db = getDb();
  const done = db.prepare("SELECT 1 FROM settled_periods WHERE period = ? AND period_key = ? UNION SELECT 1 FROM awards WHERE period = ? AND period_key = ? LIMIT 1");
  const mark = db.prepare("INSERT OR IGNORE INTO settled_periods (period, period_key) VALUES (?, ?)");
  const ins = db.prepare("INSERT OR IGNORE INTO awards (period, period_key, place, user_id, points, credit_cents) VALUES (?, ?, ?, ?, ?, ?)");
  const lookback: Record<Period, number> = { week: 8, month: 6, year: 2 };
  for (const p of PERIODS) {
    for (let back = 1; back <= lookback[p]; back++) {
      const w = periodWindow(p, back);
      if (done.get(p, w.key, p, w.key)) continue;
      const list = ranking(w);
      const shares = prizeShares(list, RANK_PRIZES[p]);
      db.transaction(() => {
        for (const r of list) {
          if (!shares.has(r.user_id)) continue;
          const credits = shares.get(r.user_id)!;
          const res = ins.run(p, w.key, r.rank, r.user_id, r.points, credits);
          if (res.changes === 0) continue;
          if (credits > 0) addCredits(r.user_id, credits, `Ranking prize: #${r.rank}, ${w.label}`);
          notify(r.user_id, `You finished #${r.rank} · ${w.label}`,
            `${r.points} points from ${r.items} handoff${r.items === 1 ? "" : "s"}.${credits ? ` ${credits / 100} credits are in your balance, ready to boost a listing.` : ""}`, "/me");
        }
        mark.run(p, w.key);
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
  if (p === "week") return `Week of ${calLabel(new Date(key + "T00:00:00Z"), { month: "short", day: "numeric", year: "numeric" })}`;
  if (p === "month") return calLabel(new Date(key + "-01T00:00:00Z"), { month: "long", year: "numeric" });
  return `School year ${key}`;
}

// ---------- personal stats ----------

export type WeekBar = { key: string; label: string; points: number; current: boolean };

/** Points per week for the last `weeks` weeks, oldest first. */
export function weeklyPoints(userId: number, weeks = 12): WeekBar[] {
  const windows = Array.from({ length: weeks }, (_, i) => periodWindow("week", weeks - 1 - i));
  const rows = getDb().prepare(
    `SELECT l.received_at, l.price_cents FROM listings l WHERE l.user_id = ? AND ${CONFIRMED} AND l.received_at >= ?`)
    .all(userId, sqlTime(windows[0].start)) as { received_at: string; price_cents: number }[];
  const bars: WeekBar[] = windows.map((w, i) => ({ key: w.key, label: w.label.replace("Week of ", ""), points: 0, current: i === weeks - 1 }));
  for (const r of rows) {
    const t = parseSql(r.received_at).getTime();
    const i = windows.findIndex((w) => t >= w.start.getTime() && t < w.end.getTime());
    if (i >= 0) bars[i].points += r.price_cents === 0 ? POINTS_GIVEAWAY : POINTS_SALE;
  }
  return bars;
}

/** Consecutive weeks with at least one confirmed handoff, counting back from this week
 *  (or from last week, so a streak isn't broken before this week is over). */
function streakFrom(bars: WeekBar[]): number {
  let i = bars.length - 1;
  if (bars[i].points === 0) i--;
  let n = 0;
  while (i >= 0 && bars[i].points > 0) { n++; i--; }
  return n;
}

export function streak(userId: number): number {
  return streakFrom(weeklyPoints(userId, 26));
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

/** How many confirmed handoffs someone has, for the small "N rehomed" line on listings. */
export function confirmedCount(userId: number): number {
  return (getDb().prepare(`SELECT COUNT(*) c FROM listings l WHERE l.user_id = ? AND ${CONFIRMED}`).get(userId) as { c: number }).c;
}

// ---------- badges ----------

export type BadgeState = (typeof BADGES)[number] & { have: number; need: number; earned: boolean };

/** Every badge, with how close this person is to it. Only confirmed handoffs count. */
export function badgeProgress(userId: number, knownStreak?: number): BadgeState[] {
  const db = getDb();
  const n = (sql: string) => (db.prepare(sql).get(userId) as { c: number }).c;
  const mine = `SELECT COUNT(*) c FROM listings l WHERE l.user_id = ? AND ${CONFIRMED}`;
  const given = n(`${mine} AND l.price_cents = 0`);
  const rehomed = n(mine);
  const books = n(`${mine} AND l.category = 'textbooks'`);
  const summer = n(`${mine} AND l.handoff = 'fall'`);
  const won = n("SELECT COUNT(*) c FROM prizes WHERE winner_id = ?");
  const weekly = n("SELECT COUNT(*) c FROM awards WHERE user_id = ? AND period = 'week' AND place = 1");
  const monthly = n("SELECT COUNT(*) c FROM awards WHERE user_id = ? AND period = 'month'");
  const yearly = n("SELECT COUNT(*) c FROM awards WHERE user_id = ? AND period = 'year'");
  const progress: Record<string, [number, number]> = {
    giver: [given, 1], generous: [given, 5], rehomer: [rehomed, 10], bookworm: [books, 3], summer: [summer, 1],
    lucky: [won, 1], early: [userId <= 50 ? 1 : 0, 1], streak: [knownStreak ?? streak(userId), 3],
    weekly: [weekly, 1], monthly: [monthly, 1], yearly: [yearly, 1],
  };
  return BADGES.map((b) => {
    const [have, need] = progress[b.slug] ?? [0, 1];
    return { ...b, have: Math.min(have, need), need, earned: have >= need };
  });
}

/** Just the badges someone has earned, for compact displays. */
export function badgesFor(userId: number, knownStreak?: number) {
  return badgeProgress(userId, knownStreak).filter((b) => b.earned);
}
