import crypto from "node:crypto";
import { getDb } from "./db";
import { GIVEAWAYS_PER_TICKET, HOUSES, categoryKg } from "./config";
import { notify } from "./social";

// ---------- credits ----------
// Credits are earned (handoffs, ranking prizes, draw prizes, organiser grants) and spent on boosts.
// They can't be bought, sent to another student, or turned into money.

export function creditBalance(userId: number): number {
  return (getDb().prepare("SELECT COALESCE(SUM(delta),0) s FROM credit_transactions WHERE user_id = ?").get(userId) as { s: number }).s;
}

export function addCredits(userId: number, delta: number, reason: string, listingId: number | null = null) {
  getDb().prepare("INSERT INTO credit_transactions (user_id, delta, reason, listing_id) VALUES (?, ?, ?, ?)").run(userId, delta, reason, listingId);
}

export function creditHistory(userId: number) {
  return getDb().prepare("SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50").all(userId) as
    { id: number; delta: number; reason: string; listing_id: number | null; created_at: string }[];
}

/** The listing this student is boosting right now, if any. One boost at a time. */
export function activeBoost(userId: number) {
  return (getDb().prepare("SELECT id, title, boosted_until FROM listings WHERE user_id = ? AND status = 'available' AND boosted_until > datetime('now') LIMIT 1").get(userId) as
    { id: number; title: string; boosted_until: string } | undefined) ?? null;
}

// ---------- giveaways & draw entries ----------

/** A giveaway only counts once the person who got it taps "I received it", and only within the
 *  fair-play limits (see confirmReceived). That stops people listing junk and marking it "gone". */
const GIVEAWAY_WHERE = "price_cents = 0 AND status = 'sold' AND received_at IS NOT NULL AND counted = 1";
const GIVEAWAY_WHERE_L = "l.price_cents = 0 AND l.status = 'sold' AND l.received_at IS NOT NULL AND l.counted = 1";

export function giveawaysInWindow(userId: number, startsAt: string, endsAt: string): number {
  return (getDb().prepare(`SELECT COUNT(*) c FROM listings WHERE user_id = ? AND ${GIVEAWAY_WHERE} AND received_at >= ? AND received_at <= ?`)
    .get(userId, startsAt, endsAt) as { c: number }).c;
}

export function ticketsFor(giveaways: number) { return Math.floor(giveaways / GIVEAWAYS_PER_TICKET); }

export type Draw = { id: number; title: string; description: string; starts_at: string; ends_at: string; drawn_at: string | null; created_at: string };
export type Prize = { id: number; draw_id: number; title: string; credit_cents: number; winner_id: number | null; position: number; winner_name: string | null };

export function currentDraw(): Draw | null {
  return (getDb().prepare("SELECT * FROM draws WHERE drawn_at IS NULL ORDER BY ends_at ASC LIMIT 1").get() as Draw | undefined) ?? null;
}

export function pastDraws(limit = 5): Draw[] {
  return getDb().prepare("SELECT * FROM draws WHERE drawn_at IS NOT NULL ORDER BY drawn_at DESC LIMIT ?").all(limit) as Draw[];
}

export function prizesFor(drawId: number): Prize[] {
  return getDb().prepare("SELECT p.*, u.name AS winner_name FROM prizes p LEFT JOIN users u ON u.id = p.winner_id WHERE p.draw_id = ? ORDER BY p.position, p.id").all(drawId) as Prize[];
}

export type Entrant = { user_id: number; name: string; house: string; giveaways: number; tickets: number };

export function entrants(draw: Draw): Entrant[] {
  const rows = getDb().prepare(
    `SELECT u.id AS user_id, u.name, u.house, COUNT(*) AS giveaways
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE ${GIVEAWAY_WHERE_L} AND u.suspended_at IS NULL AND l.received_at >= ? AND l.received_at <= ?
     GROUP BY u.id ORDER BY giveaways DESC, u.name`).all(draw.starts_at, draw.ends_at) as Omit<Entrant, "tickets">[];
  return rows.map((r) => ({ ...r, tickets: ticketsFor(r.giveaways) })).filter((r) => r.tickets > 0);
}

/** Pick winners: one per prize, weighted by entries. Nobody wins twice unless there are more
 *  prizes than entrants. Uses crypto randomness so it can't be predicted. */
export function runDraw(drawId: number): { prize: Prize; winner: Entrant | null }[] {
  const db = getDb();
  const draw = db.prepare("SELECT * FROM draws WHERE id = ?").get(drawId) as Draw | undefined;
  if (!draw || draw.drawn_at) return [];
  const pool = entrants(draw);
  const prizes = prizesFor(drawId);
  const results: { prize: Prize; winner: Entrant | null }[] = [];
  let remaining = [...pool];
  const tx = db.transaction(() => {
    for (const prize of prizes) {
      if (remaining.length === 0) remaining = [...pool]; // more prizes than people: allow repeats
      let winner: Entrant | null = null;
      const total = remaining.reduce((a, e) => a + e.tickets, 0);
      if (total > 0) {
        let r = crypto.randomInt(0, total);
        for (const e of remaining) { r -= e.tickets; if (r < 0) { winner = e; break; } }
      }
      if (winner) {
        db.prepare("UPDATE prizes SET winner_id = ? WHERE id = ?").run(winner.user_id, prize.id);
        if (prize.credit_cents > 0) addCredits(winner.user_id, prize.credit_cents, `Won "${prize.title}" in ${draw.title}`);
        notify(winner.user_id, `🎉 You won: ${prize.title}`,
          prize.credit_cents > 0 ? `${prize.credit_cents / 100} credits were added to your balance. Spend them on boosting a listing.` : "The organisers will be in touch to hand it over.", "/draw");
        remaining = remaining.filter((e) => e.user_id !== winner!.user_id);
      }
      results.push({ prize, winner });
    }
    db.prepare("UPDATE draws SET drawn_at = datetime('now') WHERE id = ?").run(drawId);
  });
  tx();
  return results;
}

/** Close out draws whose deadline has passed. Called from housekeeping. */
export function runDueDraws() {
  const due = getDb().prepare("SELECT id FROM draws WHERE drawn_at IS NULL AND ends_at <= datetime('now')").all() as { id: number }[];
  for (const d of due) runDraw(d.id);
}

// ---------- dorm cup ----------

export type HouseRow = { house: string; members: number; rehomed: number; given: number; kg: number; rank: number };

/** Every dorm from the config, plus any other dorm a member still has on file. Tied dorms share a rank.
 *  Only handoffs the receiver confirmed count, so a dorm can't climb by marking its own listings as gone. */
export function houseLeaderboard(): HouseRow[] {
  const rows = getDb().prepare(
    `SELECT u.house, COUNT(DISTINCT u.id) AS members,
       COUNT(l.id) AS rehomed,
       SUM(CASE WHEN l.price_cents = 0 THEN 1 ELSE 0 END) AS given,
       GROUP_CONCAT(l.category) AS cats
     FROM users u LEFT JOIN listings l ON l.user_id = u.id AND l.status = 'sold' AND l.received_at IS NOT NULL AND l.counted = 1
     WHERE u.verified = 1 AND u.suspended_at IS NULL GROUP BY u.house`).all() as { house: string; members: number; rehomed: number; given: number; cats: string | null }[];
  const byHouse = new Map(rows.map((r) => [r.house, r]));
  const names = [...HOUSES, ...rows.map((r) => r.house).filter((h) => !HOUSES.includes(h))];
  const list = names.map((house) => {
    const r = byHouse.get(house);
    return {
      house, members: r?.members ?? 0, rehomed: r?.rehomed ?? 0, given: r?.given ?? 0,
      kg: (r?.cats ?? "").split(",").filter(Boolean).reduce((acc, c) => acc + categoryKg(c), 0), rank: 0,
    };
  }).sort((x, y) => y.rehomed - x.rehomed || y.given - x.given);
  list.forEach((h) => { h.rank = 1 + list.filter((o) => o.rehomed > h.rehomed || (o.rehomed === h.rehomed && o.given > h.given)).length; });
  return list;
}
