"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteImages, saveImages } from "@/lib/upload";
import { holdForVerdict, judge, logJudge } from "@/lib/judge";
import { notifyAdmins } from "@/lib/moderation";
import type { FormState } from "./auth";

/** Set or replace the signed-in student's profile photo. The old file is deleted.
 *  If the AI judge is unsure about the new photo, the current one stays and the new one
 *  waits for an organiser. */
export async function updateAvatar(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  let saved: string[];
  try { saved = await saveImages([file]); } catch (e) { return { error: (e as Error).message }; }
  const verdict = await judge({ kind: "avatar", image: saved[0] });
  logJudge("avatar", user.id, verdict);
  const db = getDb();
  if (verdict?.decision === "review") {
    db.prepare("UPDATE users SET avatar_pending = ?, avatar_held_reason = ? WHERE id = ?").run(saved[0], holdForVerdict(verdict), user.id);
    await deleteImages([user.avatar_pending]);
    notifyAdmins("A profile photo is waiting for review", "The AI judge held a new profile photo.", "/admin/reports");
    revalidatePath("/", "layout");
    return { ok: true, message: "Your new photo is waiting for a quick check by an organiser. Your current photo stays until then." };
  }
  db.prepare("UPDATE users SET avatar = ?, avatar_pending = NULL, avatar_held_reason = NULL WHERE id = ?").run(saved[0], user.id);
  await deleteImages([user.avatar, user.avatar_pending]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar() {
  const user = await requireUser();
  getDb().prepare("UPDATE users SET avatar = NULL, avatar_pending = NULL, avatar_held_reason = NULL WHERE id = ?").run(user.id);
  await deleteImages([user.avatar, user.avatar_pending]);
  revalidatePath("/", "layout");
}
