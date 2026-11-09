"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, CONDITIONS, HANDOFF, HANDOFF_SPOTS, LIMITS, MAX_PHOTOS, RATE } from "@/lib/config";
import { dollarsToCents } from "@/lib/format";
import { deleteImages, saveImages } from "@/lib/upload";
import { fanOutNewListing, notify } from "@/lib/social";
import { isBlocked, notifyAdmins, screenText } from "@/lib/moderation";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

type Draft = { title: string; description: string; category: string; price_cents: number; condition: string; course_code: string | null; handoff: string; spot: string | null; images: File[] };

function validate(d: Draft): string | null {
  if (d.title.length < 2) return "Give it a title.";
  if (d.title.length > LIMITS.title) return `Title is too long (${LIMITS.title} characters max).`;
  if (d.description.length > LIMITS.description) return `Description is too long (${LIMITS.description} characters max).`;
  if (!CATEGORIES.some((c) => c.slug === d.category)) return "Pick a category.";
  if (!(CONDITIONS as readonly string[]).includes(d.condition)) return "Pick a condition.";
  if (!HANDOFF.some((h) => h.slug === d.handoff)) return "Pick a handoff option.";
  if (d.spot && !HANDOFF_SPOTS.includes(d.spot)) return "Pick a meeting spot from the list.";
  if (d.course_code && d.course_code.length > LIMITS.course) return "That course code is too long.";
  if (!Number.isFinite(d.price_cents) || d.price_cents < 0) return "Enter a price of 0 or more.";
  if (d.price_cents > 500_000) return "Price looks wrong.";
  if (d.images.length > MAX_PHOTOS) return `Add up to ${MAX_PHOTOS} photos.`;
  return null;
}

function listedToday(userId: number) {
  return (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND created_at > datetime('now', '-1 day')").get(userId) as { c: number }).c;
}

/** Save a listing. Posts that mention something not allowed are held until an organiser has looked. */
async function insertListing(userId: number, d: Draft): Promise<{ id: number; held: boolean }> {
  const db = getDb();
  const files = await saveImages(d.images);
  const held = !!screenText(d.title, d.description);
  const r = db.prepare(
    `INSERT INTO listings (user_id, title, description, category, price_cents, condition, course_code, handoff, spot, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, d.title, d.description, d.category, d.price_cents, d.condition, d.course_code, d.handoff, d.spot, held ? "review" : "available");
  const id = Number(r.lastInsertRowid);
  const ins = db.prepare("INSERT INTO listing_images (listing_id, file, position) VALUES (?, ?, ?)");
  files.forEach((f, i) => ins.run(id, f, i));
  if (held) notifyAdmins("A listing is waiting for review", `"${d.title}" mentions something that may not be allowed.`, "/admin/reports");
  else fanOutNewListing(id);
  return { id, held };
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
    images: fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0),
  };
  const err = validate(d);
  if (err) return { error: err };
  if (listedToday(user.id) >= RATE.listingsPerDay) return { error: `That's ${RATE.listingsPerDay} listings in a day. Come back tomorrow for more.` };
  let made;
  try { made = await insertListing(user.id, d); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/");
  redirect(`/listings/${made.id}`);
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
  if (listedToday(user.id) + drafts.length > RATE.listingsPerDay) return { error: `That would be more than ${RATE.listingsPerDay} listings in a day. Post fewer now and the rest tomorrow.` };
  try { for (const d of drafts) await insertListing(user.id, d); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/");
  redirect("/me?listed=" + drafts.length);
}

/** The seller moves a listing between available, reserved and gone, and says who it went to.
 *
 *  Fair-play rules live here:
 *  - the receiver must be someone who actually messaged about this listing
 *  - once the receiver has confirmed, the handoff is locked and can't be reopened and confirmed again */
export async function setListingStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const id = Number(fd.get("id"));
  const status = str(fd, "status");
  const buyerId = fd.get("buyer_id") ? Number(fd.get("buyer_id")) : null;
  if (!["available", "pending", "sold"].includes(status)) return { error: "Pick a status." };
  const db = getDb();
  const l = db.prepare("SELECT user_id, title, price_cents, status, buyer_id, received_at FROM listings WHERE id = ?").get(id) as
    { user_id: number; title: string; price_cents: number; status: string; buyer_id: number | null; received_at: string | null } | undefined;
  if (!l || l.user_id !== user.id) return { error: "That isn't your listing." };
  if (l.status === "review") return { error: "An organiser is checking this listing. You can change it once it's live." };
  if (l.status === "removed") return { error: "This listing was removed by an organiser." };
  if (l.received_at) return { error: "This handoff has been confirmed, so it's locked. List the item again if you need to." };
  if (buyerId !== null && status !== "available") {
    const chatted = db.prepare("SELECT 1 FROM threads WHERE listing_id = ? AND ((user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?))").get(id, user.id, buyerId, buyerId, user.id);
    if (!chatted || buyerId === user.id) return { error: "Pick someone who messaged you about this listing." };
    if (isBlocked(user.id, buyerId)) return { error: "You can't hand this to that student." };
  }
  const newBuyer = status === "available" ? null : buyerId;
  db.prepare("UPDATE listings SET status = ?, buyer_id = ?, received_at = NULL, boosted_until = CASE WHEN ? = 'available' THEN boosted_until ELSE NULL END, closed_at = CASE WHEN ? = 'sold' THEN datetime('now') ELSE NULL END WHERE id = ?")
    .run(status, newBuyer, status, status, id);
  if (newBuyer && (newBuyer !== l.buyer_id || status !== l.status)) {
    notify(newBuyer, status === "sold" ? "Did you get it? Tap to confirm" : "Item reserved for you",
      status === "sold"
        ? `${user.name} marked "${l.title}" as handed over to you. Confirm it if you have it, or say you didn't get it.`
        : `${user.name} reserved "${l.title}" for you.`, `/listings/${id}`);
  }
  revalidatePath("/"); revalidatePath(`/listings/${id}`); revalidatePath("/me");
  redirect(`/listings/${id}?updated=1`);
}

export async function deleteListing(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const l = db.prepare("SELECT received_at FROM listings WHERE id = ? AND user_id = ?").get(id, user.id) as { received_at: string | null } | undefined;
  if (!l) redirect("/me");
  // A confirmed handoff has already earned points, so it stays on the record.
  if (l.received_at) redirect(`/listings/${id}?locked=1`);
  const files = (db.prepare("SELECT file FROM listing_images WHERE listing_id = ?").all(id) as { file: string }[]).map((r) => r.file);
  db.prepare("DELETE FROM listings WHERE id = ? AND user_id = ?").run(id, user.id);
  await deleteImages(files);
  revalidatePath("/");
  redirect("/me");
}
