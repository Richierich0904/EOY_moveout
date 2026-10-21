import crypto from "node:crypto";
import { getDb } from "./db";
import { BADGES, GIVEAWAYS_PER_TICKET, categoryKg } from "./config";
import { notify } from "./social";

// ---------- credits ----------

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

// ---------- giveaways & tickets ----------

/** A giveaway only counts once the person who got it taps "I received it". That stops people
 *  listing junk and marking it "gone" to farm tickets. */
const GIVEAWAY_WHERE = "price_cents = 0 AND status = 'sold' AND buyer_id IS NOT NULL AND buyer_id != user_id AND received_at IS NOT NULL";
const GIVEAWAY_WHERE_L = "l.price_cents = 0 AND l.status = 'sold' AND l.buyer_id IS NOT NULL AND l.buyer_id != l.user_id AND l.received_at IS NOT NULL";

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
     WHERE ${GIVEAWAY_WHERE_L} AND l.received_at >= ? AND l.received_at <= ?
     GROUP BY u.id ORDER BY giveaways DESC, u.name`).all(draw.starts_at, draw.ends_at) as Omit<Entrant, "tickets">[];
  return rows.map((r) => ({ ...r, tickets: ticketsFor(r.giveaways) })).filter((r) => r.tickets > 0);
}

/** Pick winners: one per prize, weighted by tickets. Nobody wins twice unless there are more
 *  prizes than entrants. Uses crypto randomness so it can't be predicted. */
export function runDraw(drawId: number): { prize: Prize; winner: Entrant | null }[] {
  const db = getDb();
  const draw = db.prepare("SELECT * FROM draws WHERE id = ?").get(drawId) as Draw | undefined;
  if (!draw || draw.drawn_at) throw new Error("Draw not found or already drawn.");
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
          prize.credit_cents > 0 ? `${prize.credit_cents / 100} credits were added to your balance.` : "The organisers will be in touch to hand it over.", "/lottery");
        remaining = remaining.filter((e) => e.user_id !== winner!.user_id);
      }
      results.push({ prize, winner });
    }
    db.prepare("UPDATE draws SET drawn_at = datetime('now') WHERE id = ?").run(drawId);
  });
  tx();
  return results;
}

/** Lazy scheduler: any page that calls this will close out draws whose deadline has passed. */
export function runDueDraws() {
  const due = getDb().prepare("SELECT id FROM draws WHERE drawn_at IS NULL AND ends_at <= datetime('now')").all() as { id: number }[];
  for (const d of due) runDraw(d.id);
}

// ---------- badges & leaderboard ----------

export function badgesFor(userId: number): (typeof BADGES)[number][] {
  const db = getDb();
  const n = (sql: string) => (db.prepare(sql).get(userId) as { c: number }).c;
  const given = n(`SELECT COUNT(*) c FROM listings WHERE user_id = ? AND ${GIVEAWAY_WHERE}`);
  const rehomed = n("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold'");
  const books = n("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold' AND category = 'textbooks'");
  const summer = n("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold' AND handoff = 'fall'");
  const won = n("SELECT COUNT(*) c FROM prizes WHERE winner_id = ?");
  const early = userId <= 50;
  const have: Record<string, boolean> = { giver: given >= 1, generous: given >= 5, rehomer: rehomed >= 10, bookworm: books >= 3, summer: summer >= 1, lucky: won >= 1, early };
  return BADGES.filter((b) => have[b.slug]);
}

export type HouseRow = { house: string; members: number; rehomed: number; given: number; kg: number };

export function houseLeaderboard(): HouseRow[] {
  const rows = getDb().prepare(
    `SELECT u.house, COUNT(DISTINCT u.id) AS members,
       COUNT(l.id) AS rehomed,
       SUM(CASE WHEN l.price_cents = 0 THEN 1 ELSE 0 END) AS given,
       GROUP_CONCAT(l.category) AS cats
     FROM users u LEFT JOIN listings l ON l.user_id = u.id AND l.status = 'sold'
     WHERE u.verified = 1 GROUP BY u.house`).all() as { house: string; members: number; rehomed: number; given: number; cats: string | null }[];
  return rows.map((r) => ({
    house: r.house, members: r.members, rehomed: r.rehomed, given: r.given ?? 0,
    kg: (r.cats ?? "").split(",").filter(Boolean).reduce((a, c) => a + categoryKg(c), 0),
  })).sort((a, b) => b.rehomed - a.rehomed || b.given - a.given);
}
