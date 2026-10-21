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
  status: "available" | "pending" | "sold";
  buyer_id: number | null;
  created_at: string;
  closed_at: string | null;
  // joined
  seller_name: string;
  seller_house: string;
  seller_grad_year: number;
  image: string | null;
};

export type ListingFilters = {
  q?: string;
  category?: string;
  free?: boolean;
  fall?: boolean;
  course?: string;
  maxPrice?: number;
  sort?: "new" | "cheap" | "pricey";
  status?: "available" | "all";
  userId?: number;
  limit?: number;
};

const BASE_SELECT = `
  SELECT l.*, u.name AS seller_name, u.house AS seller_house, u.grad_year AS seller_grad_year,
    (SELECT file FROM listing_images i WHERE i.listing_id = l.id ORDER BY position LIMIT 1) AS image
  FROM listings l JOIN users u ON u.id = l.user_id`;

export function searchListings(f: ListingFilters = {}): Listing[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status !== "all") where.push("l.status = 'available'");
  if (f.userId) { where.push("l.user_id = ?"); params.push(f.userId); }
  if (f.category) { where.push("l.category = ?"); params.push(f.category); }
  if (f.free) where.push("l.price_cents = 0");
  if (f.fall) where.push("l.handoff = 'fall'");
  if (f.maxPrice !== undefined) { where.push("l.price_cents <= ?"); params.push(f.maxPrice); }
  if (f.course) { where.push("UPPER(REPLACE(l.course_code,' ','')) = ?"); params.push(f.course.toUpperCase().replace(/\s/g, "")); }
  if (f.q) {
    const like = `%${f.q.trim()}%`;
    where.push("(l.title LIKE ? OR l.description LIKE ? OR l.course_code LIKE ?)");
    params.push(like, like, like);
  }
  const order =
    f.sort === "cheap" ? "l.price_cents ASC, l.created_at DESC"
    : f.sort === "pricey" ? "l.price_cents DESC, l.created_at DESC"
    : "l.created_at DESC";
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
