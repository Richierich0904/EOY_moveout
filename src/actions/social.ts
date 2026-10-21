"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/config";
import { dollarsToCents } from "@/lib/format";
import { getOrCreateThread, getThread, notify } from "@/lib/social";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

// ---------- wanted board ----------

export async function createWant(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const title = str(fd, "title"), description = str(fd, "description"), category = str(fd, "category");
  const maxPrice = str(fd, "max_price");
  if (title.length < 2) return { error: "Say what you're looking for." };
  if (!CATEGORIES.some((c) => c.slug === category)) return { error: "Pick a category." };
  const r = getDb().prepare("INSERT INTO wants (user_id, title, description, category, max_price_cents) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, title, description, category, maxPrice ? dollarsToCents(maxPrice) : null);
  revalidatePath("/wanted");
  redirect(`/wanted/${Number(r.lastInsertRowid)}`);
}

export async function setWantStatus(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id")); const status = str(fd, "status");
  if (!["open", "fulfilled"].includes(status)) throw new Error("Bad status");
  getDb().prepare("UPDATE wants SET status = ? WHERE id = ? AND user_id = ?").run(status, id, user.id);
  revalidatePath("/wanted"); revalidatePath(`/wanted/${id}`); revalidatePath("/me");
}

export async function deleteWant(fd: FormData) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM wants WHERE id = ? AND user_id = ?").run(Number(fd.get("id")), user.id);
  revalidatePath("/wanted");
  redirect("/me");
}

// ---------- messaging ----------

/** Start (or reopen) a conversation about a listing or a wanted post and send the first message. */
export async function startThread(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const body = str(fd, "body");
  const listingId = fd.get("listing_id") ? Number(fd.get("listing_id")) : undefined;
  const wantId = fd.get("want_id") ? Number(fd.get("want_id")) : undefined;
  if (!body) return { error: "Write a message." };
  const db = getDb();
  let other: number | undefined; let subject = "";
  if (listingId) {
    const l = db.prepare("SELECT user_id, title FROM listings WHERE id = ?").get(listingId) as { user_id: number; title: string } | undefined;
    if (!l) return { error: "Listing not found." }; other = l.user_id; subject = l.title;
  } else if (wantId) {
    const w = db.prepare("SELECT user_id, title FROM wants WHERE id = ?").get(wantId) as { user_id: number; title: string } | undefined;
    if (!w) return { error: "Wanted post not found." }; other = w.user_id; subject = `Wanted: ${w.title}`;
  }
  if (!other) return { error: "Nothing to message about." };
  if (other === user.id) return { error: "That's your own post." };
  const threadId = getOrCreateThread({ listingId, wantId, me: user.id, other });
  db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)").run(threadId, user.id, body);
  db.prepare("UPDATE threads SET last_message_at = datetime('now') WHERE id = ?").run(threadId);
  notify(other, `New message from ${user.name}`, `About "${subject}": ${body.slice(0, 80)}`, `/messages/${threadId}`);
  redirect(`/messages/${threadId}`);
}

export async function sendMessage(fd: FormData) {
  const user = await requireUser();
  const threadId = Number(fd.get("thread_id")); const body = str(fd, "body");
  if (!body) return;
  const t = getThread(threadId, user.id);
  if (!t) throw new Error("No such conversation");
  const db = getDb();
  db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)").run(threadId, user.id, body);
  db.prepare("UPDATE threads SET last_message_at = datetime('now') WHERE id = ?").run(threadId);
  notify(t.other_id, `New message from ${user.name}`, `About "${t.subject}": ${body.slice(0, 80)}`, `/messages/${threadId}`);
  revalidatePath(`/messages/${threadId}`); revalidatePath("/messages");
}

// ---------- saved searches & notifications ----------

export async function saveSearch(fd: FormData) {
  const user = await requireUser();
  const query = str(fd, "q"); const category = str(fd, "category") || null;
  const freeOnly = fd.get("free") ? 1 : 0; const max = str(fd, "max");
  if (!query && !category && !freeOnly && !max) return;
  const maxCents = max ? dollarsToCents(max) : null;
  const dup = getDb().prepare(
    "SELECT 1 FROM saved_searches WHERE user_id = ? AND query = ? AND COALESCE(category,'') = ? AND free_only = ? AND COALESCE(max_price_cents,-1) = ?")
    .get(user.id, query, category ?? "", freeOnly, maxCents ?? -1);
  if (dup) redirect("/alerts?saved=1");
  getDb().prepare("INSERT INTO saved_searches (user_id, query, category, free_only, max_price_cents) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, query, category, freeOnly, maxCents);
  revalidatePath("/alerts");
  redirect("/alerts?saved=1");
}

export async function deleteSavedSearch(fd: FormData) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM saved_searches WHERE id = ? AND user_id = ?").run(Number(fd.get("id")), user.id);
  revalidatePath("/alerts");
}

export async function markAllRead() {
  const user = await requireUser();
  getDb().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(user.id);
  revalidatePath("/alerts"); revalidatePath("/", "layout");
}
