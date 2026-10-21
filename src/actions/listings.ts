"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, CONDITIONS, HANDOFF } from "@/lib/config";
import { dollarsToCents } from "@/lib/format";
import { saveImages } from "@/lib/upload";
import { fanOutNewListing, notify } from "@/lib/social";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

type Draft = { title: string; description: string; category: string; price_cents: number; condition: string; course_code: string | null; handoff: string; spot: string | null; images: File[] };

function validate(d: Draft): string | null {
  if (d.title.length < 2) return "Give it a title.";
  if (d.title.length > 80) return "Title is too long (80 characters max).";
  if (!CATEGORIES.some((c) => c.slug === d.category)) return "Pick a category.";
  if (!(CONDITIONS as readonly string[]).includes(d.condition)) return "Pick a condition.";
  if (!HANDOFF.some((h) => h.slug === d.handoff)) return "Pick a handoff option.";
  if (d.price_cents > 500_000) return "Price looks wrong.";
  return null;
}

async function insertListing(userId: number, d: Draft) {
  const db = getDb();
  const files = await saveImages(d.images);
  const r = db.prepare(
    `INSERT INTO listings (user_id, title, description, category, price_cents, condition, course_code, handoff, spot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, d.title, d.description, d.category, d.price_cents, d.condition, d.course_code, d.handoff, d.spot);
  const id = Number(r.lastInsertRowid);
  const ins = db.prepare("INSERT INTO listing_images (listing_id, file, position) VALUES (?, ?, ?)");
  files.forEach((f, i) => ins.run(id, f, i));
  fanOutNewListing(id);
  return id;
}

export async function createListing(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const d: Draft = {
    title: str(fd, "title"),
    description: str(fd, "description"),
    category: str(fd, "category"),
    price_cents: fd.get("free") === "on" ? 0 : dollarsToCents(str(fd, "price")),
    condition: str(fd, "condition"),
    course_code: str(fd, "course_code").toUpperCase() || null,
    handoff: str(fd, "handoff") || "now",
    spot: str(fd, "spot") || null,
    images: fd.getAll("images").filter((f): f is File => f instanceof File),
  };
  const err = validate(d);
  if (err) return { error: err };
  let id: number;
  try { id = await insertListing(user.id, d); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/");
  redirect(`/listings/${id}`);
}

/** Move-out mode: several items in one go. Rows with an empty title are skipped. */
export async function createListingsBulk(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const handoff = str(fd, "handoff") || "now";
  const spot = str(fd, "spot") || null;
  const drafts: Draft[] = [];
  for (let i = 0; i < 10; i++) {
    const title = str(fd, `title_${i}`);
    if (!title) continue;
    const img = fd.get(`image_${i}`);
    drafts.push({
      title,
      description: "",
      category: str(fd, `category_${i}`),
      price_cents: dollarsToCents(str(fd, `price_${i}`)),
      condition: "Good",
      course_code: null,
      handoff, spot,
      images: img instanceof File && img.size > 0 ? [img] : [],
    });
  }
  if (drafts.length === 0) return { error: "Add at least one item." };
  for (const d of drafts) { const err = validate(d); if (err) return { error: `"${d.title}": ${err}` }; }
  try { for (const d of drafts) await insertListing(user.id, d); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/");
  redirect("/me?listed=" + drafts.length);
}

export async function setListingStatus(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const status = str(fd, "status");
  const buyerId = fd.get("buyer_id") ? Number(fd.get("buyer_id")) : null;
  if (!["available", "pending", "sold"].includes(status)) throw new Error("Bad status");
  const db = getDb();
  const l = db.prepare("SELECT user_id, title FROM listings WHERE id = ?").get(id) as { user_id: number; title: string } | undefined;
  if (!l || l.user_id !== user.id) throw new Error("Not your listing");
  db.prepare("UPDATE listings SET status = ?, buyer_id = ?, closed_at = CASE WHEN ? = 'sold' THEN datetime('now') ELSE NULL END WHERE id = ?")
    .run(status, status === "available" ? null : buyerId, status, id);
  if (buyerId && status !== "available") {
    notify(buyerId, status === "sold" ? "Marked as yours" : "Item reserved for you",
      `${user.name} marked "${l.title}" as ${status === "sold" ? "handed over to you" : "reserved for you"}.`, `/listings/${id}`);
  }
  revalidatePath("/"); revalidatePath(`/listings/${id}`); revalidatePath("/me");
}

export async function deleteListing(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  getDb().prepare("DELETE FROM listings WHERE id = ? AND user_id = ?").run(id, user.id);
  revalidatePath("/");
  redirect("/me");
}
