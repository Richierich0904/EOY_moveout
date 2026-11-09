"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { checkPassword, createSession, destroyAllSessions, destroySession, hashPassword, requireUser } from "@/lib/auth";
import { HOUSES, LIMITS } from "@/lib/config";
import { deleteImages } from "@/lib/upload";
import type { FormState } from "./auth";

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const name = str(fd, "name").replace(/\s+/g, " ");
  const house = str(fd, "house");
  const gradYear = parseInt(str(fd, "grad_year"), 10);
  if (name.length < 2) return { error: "Enter your name." };
  if (name.length > LIMITS.name) return { error: `Name is too long (${LIMITS.name} characters max).` };
  if (!HOUSES.includes(house)) return { error: "Pick your dorm." };
  const y = new Date().getFullYear();
  if (!(gradYear >= y - 1 && gradYear <= y + 8)) return { error: "Enter a realistic graduation year." };
  getDb().prepare("UPDATE users SET name = ?, house = ?, grad_year = ?, hide_from_rankings = ? WHERE id = ?")
    .run(name, house, gradYear, fd.get("hide_from_rankings") === "on" ? 1 : 0, user.id);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const current = String(fd.get("current") ?? ""), next = String(fd.get("password") ?? "");
  if (next.length < 8) return { error: "The new password needs at least 8 characters." };
  if (next.length > 72) return { error: "Password is too long (72 characters max)." };
  const row = getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  if (!(await checkPassword(current, row.password_hash))) return { error: "Your current password isn't right." };
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), user.id);
  // Sign out every other device, then keep this one signed in.
  destroyAllSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

/** Delete the account and everything on it: listings, wanted posts, messages, photos. */
export async function deleteAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  if (!(await checkPassword(String(fd.get("password") ?? ""), row.password_hash))) return { error: "That password isn't right." };
  const photos = (db.prepare("SELECT i.file FROM listing_images i JOIN listings l ON l.id = i.listing_id WHERE l.user_id = ?").all(user.id) as { file: string }[]).map((r) => r.file);
  db.transaction(() => {
    // Things other students own keep working, just without this student's name on them.
    db.prepare("UPDATE listings SET buyer_id = NULL WHERE buyer_id = ?").run(user.id);
    db.prepare("UPDATE prizes SET winner_id = NULL WHERE winner_id = ?").run(user.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  })();
  await deleteImages([...photos, user.avatar]);
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
