"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteImages, saveImages } from "@/lib/upload";
import type { FormState } from "./auth";

/** Set or replace the signed-in student's profile photo. The old file is deleted. */
export async function updateAvatar(_prev: FormState, fd: FormData): Promise<FormState> {
  let user;
  try { user = await requireUser(); } catch (e) { return { error: (e as Error).message }; }
  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  let saved: string[];
  try { saved = await saveImages([file]); } catch (e) { return { error: (e as Error).message }; }
  getDb().prepare("UPDATE users SET avatar = ? WHERE id = ?").run(saved[0], user.id);
  await deleteImages([user.avatar]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar() {
  const user = await requireUser();
  getDb().prepare("UPDATE users SET avatar = NULL WHERE id = ?").run(user.id);
  await deleteImages([user.avatar]);
  revalidatePath("/", "layout");
}
