import { getDb } from "./db";
import { categoryKg } from "./config";

export type Listing = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  price_cents: number;
  condition: string;
  course_code: string | null;
  handoff: "now" | "fall";
  spot: string | null;
  /** review = held until an organiser has looked at it. removed = taken down by an organiser. */
  status: "available" | "pending" | "sold" | "review" | "removed";
  buyer_id: number | null;
  created_at: string;
  closed_at: string | null;
  received_at: string | null;
  /** 1 when a confirmed handoff counts for points, entries and credits. */
  counted: number;
  boosted_until: string | null;
  removed_reason: string | null;
  // joined
  seller_name: string;
  seller_house: string;
  seller_grad_year: number;
  seller_avatar: string | null;
  image: string | null;
  /** 1 while a paid-for boost is running on an available listing. */
  boosted: number;
};

export type ListingFilters = {
  q?: string;
  category?: string;
  free?: boolean;
  fall?: boolean;
  course?: string;
  maxPrice?: number;
  minPrice?: number;
  sort?: "new" | "cheap" | "pricey";
  status?: "available" | "all";
  userId?: number;
  /** Whoever is looking. Students who blocked each other don't see each other's listings. */
  viewerId?: number;
  limit?: number;
};

const BASE_SELECT = `
  SELECT l.*, u.name AS seller_name, u.house AS seller_house, u.grad_year AS seller_grad_year, u.avatar AS seller_avatar,
    (SELECT file FROM listing_images i WHERE i.listing_id = l.id ORDER BY position LIMIT 1) AS image,
    (l.status = 'available' AND l.boosted_until IS NOT NULL AND l.boosted_until > datetime('now')) AS boosted
  FROM listings l JOIN users u ON u.id = l.user_id`;

/** Available, and not from a paused account. For plain counts on the listings table. */
const LIVE = "status = 'available' AND user_id NOT IN (SELECT id FROM users WHERE suspended_at IS NOT NULL)";

/** A LIKE pattern that treats % and _ in the search as ordinary characters. Pair with ESCAPE '\'. */
export function likePattern(q: string) {
  return `%${q.trim().replace(/[\\%_]/g, "\\$&")}%`;
}

export function searchListings(f: ListingFilters = {}): Listing[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status !== "all") where.push("l.status = 'available' AND u.suspended_at IS NULL");
  if (f.userId) { where.push("l.user_id = ?"); params.push(f.userId); }
  if (f.viewerId) {
    where.push("l.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ? UNION SELECT blocker_id FROM blocks WHERE blocked_id = ?)");
    params.push(f.viewerId, f.viewerId);
  }
  if (f.category) { where.push("l.category = ?"); params.push(f.category); }
  if (f.free) where.push("l.price_cents = 0");
  if (f.fall) where.push("l.handoff = 'fall'");
  if (f.maxPrice !== undefined && Number.isFinite(f.maxPrice)) { where.push("l.price_cents <= ?"); params.push(f.maxPrice); }
  if (f.minPrice !== undefined && Number.isFinite(f.minPrice)) { where.push("l.price_cents >= ?"); params.push(f.minPrice); }
  if (f.course) { where.push("UPPER(REPLACE(l.course_code,' ','')) = ?"); params.push(f.course.toUpperCase().replace(/\s/g, "")); }
  if (f.q?.trim()) {
    const like = likePattern(f.q);
    where.push("(l.title LIKE ? ESCAPE '\\' OR l.description LIKE ? ESCAPE '\\' OR l.course_code LIKE ? ESCAPE '\\')");
    params.push(like, like, like);
  }
  // Boosted listings lead the default order. Sorting by price ignores boosts, so "cheapest first" stays honest.
  const order =
    f.sort === "cheap" ? "l.price_cents ASC, l.created_at DESC"
    : f.sort === "pricey" ? "l.price_cents DESC, l.created_at DESC"
    : "boosted DESC, l.created_at DESC";
  const sql = `${BASE_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} LIMIT ${f.limit ?? 200}`;
  return getDb().prepare(sql).all(...params) as Listing[];
}

export function getListing(id: number): Listing | null {
  return (getDb().prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id) as Listing | undefined) ?? null;
}

export function getListingImages(id: number): string[] {
  return (getDb().prepare("SELECT file FROM listing_images WHERE listing_id = ? ORDER BY position").all(id) as { file: string }[]).map((r) => r.file);
}

/** Does a listing match a saved search? Mirrors the SQL filters in searchListings. */
export function listingMatchesSearch(l: { title: string; description: string; category: string; price_cents: number; course_code: string | null },
  s: { query: string; category: string | null; free_only: number; max_price_cents: number | null }) {
  if (s.category && s.category !== l.category) return false;
  if (s.free_only && l.price_cents !== 0) return false;
  if (s.max_price_cents !== null && l.price_cents > s.max_price_cents) return false;
  const q = s.query.trim().toLowerCase();
  if (q) {
    const hay = `${l.title} ${l.description} ${l.course_code ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** Suggest a price from what similar items actually sold for on this platform. */
export function priceSuggestion(category: string): { median: number; n: number } | null {
  const rows = getDb()
    .prepare("SELECT price_cents FROM listings WHERE category = ? AND status = 'sold' AND price_cents > 0 ORDER BY price_cents")
    .all(category) as { price_cents: number }[];
  if (rows.length < 3) return null;
  return { median: rows[Math.floor(rows.length / 2)].price_cents, n: rows.length };
}

export type Impact = { items: number; kg: number; freeItems: number; dollars: number; byCategory: { category: string; items: number; kg: number }[] };

export function impactStats(): Impact {
  const rows = getDb()
    .prepare("SELECT category, COUNT(*) AS items, SUM(CASE WHEN price_cents = 0 THEN 1 ELSE 0 END) AS free_items, SUM(price_cents) AS cents FROM listings WHERE status = 'sold' GROUP BY category ORDER BY items DESC")
    .all() as { category: string; items: number; free_items: number; cents: number }[];
  const byCategory = rows.map((r) => ({ category: r.category, items: r.items, kg: r.items * categoryKg(r.category) }));
  return {
    items: rows.reduce((a, r) => a + r.items, 0),
    kg: byCategory.reduce((a, r) => a + r.kg, 0),
    freeItems: rows.reduce((a, r) => a + r.free_items, 0),
    dollars: rows.reduce((a, r) => a + r.cents, 0) / 100,
    byCategory,
  };
}

/** One row per category: how many items are available, for the menus and filters. */
export function categoryShelves(): { category: string; count: number }[] {
  return getDb().prepare(`SELECT category, COUNT(*) AS count FROM listings WHERE ${LIVE} GROUP BY category`).all() as { category: string; count: number }[];
}

/** Newest available listings that have a photo, for the hero collage. */
export function heroImages(n = 3, viewerId = 0): { id: number; title: string; image: string }[] {
  return searchListings({ limit: 40, viewerId: viewerId || undefined }).filter((l) => l.image).slice(0, n).map((l) => ({ id: l.id, title: l.title, image: l.image! }));
}

/** Counts for the filter sidebar. */
export function facetCounts(): { all: number; free: number; fall: number } {
  const one = (sql: string) => (getDb().prepare(sql).get() as { c: number }).c;
  return {
    all: one(`SELECT COUNT(*) c FROM listings WHERE ${LIVE}`),
    free: one(`SELECT COUNT(*) c FROM listings WHERE ${LIVE} AND price_cents = 0`),
    fall: one(`SELECT COUNT(*) c FROM listings WHERE ${LIVE} AND handoff = 'fall'`),
  };
}
