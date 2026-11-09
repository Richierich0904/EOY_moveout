"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, LIMITS, RATE } from "@/lib/config";
import { dollarsToCents } from "@/lib/format";
import { getOrCreateThread, getThread, notify, threadExists } from "@/lib/social";
import { isBlocked, notifyAdmins, screenText } from "@/lib/moderation";
import { hits, record } from "@/lib/limits";
import { describeHold, holdForVerdict, holdForWord, judge, judgeOn, logJudge } from "@/lib/judge";
import { categoryLabel } from "@/lib/config";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

// ---------- wanted board ----------

export async function createWant(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const title = str(fd, "title"), description = str(fd, "description"), category = str(fd, "category");
  const maxPrice = str(fd, "max_price");
  if (title.length < 2) return { error: "Say what you're looking for." };
  if (title.length > LIMITS.title) return { error: `Keep the title under ${LIMITS.title} characters.` };
  if (description.length > LIMITS.want) return { error: `Details are too long (${LIMITS.want} characters max).` };
  if (!CATEGORIES.some((c) => c.slug === category)) return { error: "Pick a category." };
  const max = maxPrice ? dollarsToCents(maxPrice) : null;
  if (max !== null && max > 500_000) return { error: "That price looks wrong." };
  const db = getDb();
  const today = (db.prepare("SELECT COUNT(*) c FROM wants WHERE user_id = ? AND created_at > datetime('now', '-1 day')").get(user.id) as { c: number }).c;
  if (today >= 10) return { error: "That's 10 wanted posts in a day. Come back tomorrow for more." };
  // The instant word list first, then the AI judge for anything the list can't catch.
  const word = screenText(title, description);
  const judged = !word && judgeOn();
  const verdict = judged ? await judge({ kind: "want", title, description, category: categoryLabel(category), maxPriceCents: max }) : null;
  const held = word ? holdForWord(word) : verdict?.decision === "review" ? holdForVerdict(verdict) : null;
  const r = db.prepare("INSERT INTO wants (user_id, title, description, category, max_price_cents, status, held_reason) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(user.id, title, description, category, max, held ? "review" : "open", held);
  if (judged) logJudge("want", Number(r.lastInsertRowid), verdict);
  if (held) notifyAdmins("A wanted post is waiting for review", `"${title}" was held by the ${describeHold(held).by.toLowerCase()}.`, "/admin/reports");
  revalidatePath("/wanted");
  redirect(`/wanted/${Number(r.lastInsertRowid)}`);
}

export async function setWantStatus(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id")); const status = str(fd, "status");
  if (!["open", "fulfilled"].includes(status)) return;
  // Posts that are being checked or were removed stay as they are.
  getDb().prepare("UPDATE wants SET status = ? WHERE id = ? AND user_id = ? AND status IN ('open', 'fulfilled')").run(status, id, user.id);
  revalidatePath("/wanted"); revalidatePath(`/wanted/${id}`); revalidatePath("/me");
}

export async function deleteWant(fd: FormData) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM wants WHERE id = ? AND user_id = ?").run(Number(fd.get("id")), user.id);
  revalidatePath("/wanted");
  redirect("/me");
}

// ---------- messaging ----------

function checkMessage(userId: number, body: string): string | null {
  if (!body) return "Write a message.";
  if (body.length > LIMITS.message) return `That message is too long (${LIMITS.message} characters max).`;
  const recent = (getDb().prepare("SELECT COUNT(*) c FROM messages WHERE sender_id = ? AND created_at > datetime('now', '-10 minutes')").get(userId) as { c: number }).c;
  if (recent >= RATE.messagesPer10Min) return "You're sending messages very fast. Give it a few minutes.";
  return null;
}

/** Start (or reopen) a conversation about a listing or a wanted post and send the first message. */
export async function startThread(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const body = str(fd, "body");
  const listingId = fd.get("listing_id") ? Number(fd.get("listing_id")) : undefined;
  const wantId = fd.get("want_id") ? Number(fd.get("want_id")) : undefined;
  const bad = checkMessage(user.id, body);
  if (bad) return { error: bad };
  const db = getDb();
  let other: number | undefined; let subject = "";
  if (listingId) {
    const l = db.prepare("SELECT user_id, title, status FROM listings WHERE id = ?").get(listingId) as { user_id: number; title: string; status: string } | undefined;
    if (!l || l.status === "review" || l.status === "removed") return { error: "Listing not found." };
    other = l.user_id; subject = l.title;
  } else if (wantId) {
    const w = db.prepare("SELECT user_id, title, status FROM wants WHERE id = ?").get(wantId) as { user_id: number; title: string; status: string } | undefined;
    if (!w || w.status === "review" || w.status === "removed") return { error: "Wanted post not found." };
    other = w.user_id; subject = `Wanted: ${w.title}`;
  }
  if (!other) return { error: "Nothing to message about." };
  if (other === user.id) return { error: "That's your own post." };
  if (isBlocked(user.id, other)) return { error: "You can't message this student." };
  if (db.prepare("SELECT 1 FROM users WHERE id = ? AND suspended_at IS NOT NULL").get(other)) return { error: "This student's account is paused." };
  if (!threadExists({ listingId, wantId, me: user.id, other })) {
    const key = `newchat:${user.id}`;
    if (hits(key, 86400) >= RATE.newChatsPerDay) return { error: `You've started ${RATE.newChatsPerDay} new chats today. Carry on with the ones you have, or come back tomorrow.` };
    record(key);
  }
  const threadId = getOrCreateThread({ listingId, wantId, me: user.id, other });
  db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)").run(threadId, user.id, body);
  db.prepare("UPDATE threads SET last_message_at = datetime('now') WHERE id = ?").run(threadId);
  notify(other, `New message from ${user.name}`, `About "${subject}"`, `/messages/${threadId}`);
  redirect(`/messages/${threadId}`);
}

export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const threadId = Number(fd.get("thread_id")); const body = str(fd, "body");
  const t = getThread(threadId, user.id);
  if (!t) return { error: "That conversation doesn't exist." };
  const bad = checkMessage(user.id, body);
  if (bad) return { error: bad };
  if (isBlocked(user.id, t.other_id)) return { error: "You can't message this student." };
  const db = getDb();
  db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)").run(threadId, user.id, body);
  db.prepare("UPDATE threads SET last_message_at = datetime('now') WHERE id = ?").run(threadId);
  // One alert per chat until they read it, not one per message.
  const pending = db.prepare("SELECT 1 FROM notifications WHERE user_id = ? AND link = ? AND read = 0").get(t.other_id, `/messages/${threadId}`);
  if (!pending) notify(t.other_id, `New message from ${user.name}`, `About "${t.subject}"`, `/messages/${threadId}`);
  revalidatePath(`/messages/${threadId}`); revalidatePath("/messages");
  return { ok: true };
}

// ---------- saved searches & notifications ----------

export async function saveSearch(fd: FormData) {
  const user = await requireUser();
  const query = str(fd, "q").slice(0, 80);
  const rawCategory = str(fd, "category");
  const category = CATEGORIES.some((c) => c.slug === rawCategory) ? rawCategory : null;
  const freeOnly = fd.get("free") ? 1 : 0; const max = str(fd, "max");
  if (!query && !category && !freeOnly && !max) return;
  const maxCents = max ? Math.min(dollarsToCents(max), 500_000) : null;
  const db = getDb();
  const dup = db.prepare(
    "SELECT 1 FROM saved_searches WHERE user_id = ? AND query = ? AND COALESCE(category,'') = ? AND free_only = ? AND COALESCE(max_price_cents,-1) = ?")
    .get(user.id, query, category ?? "", freeOnly, maxCents ?? -1);
  const count = (db.prepare("SELECT COUNT(*) c FROM saved_searches WHERE user_id = ?").get(user.id) as { c: number }).c;
  if (!dup && count < 30) {
    db.prepare("INSERT INTO saved_searches (user_id, query, category, free_only, max_price_cents) VALUES (?, ?, ?, ?, ?)")
      .run(user.id, query, category, freeOnly, maxCents);
    revalidatePath("/alerts");
  }
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
