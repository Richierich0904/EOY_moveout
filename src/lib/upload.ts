import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { UPLOAD_DIR } from "./db";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/heic": "heic" };

/** Save uploaded image files to disk and return their stored file names. */
export async function saveImages(files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) {
    if (!f || f.size === 0) continue;
    const ext = TYPES[f.type];
    if (!ext) throw new Error(`Unsupported image type: ${f.type || "unknown"}`);
    if (f.size > MAX_BYTES) throw new Error(`"${f.name}" is over 8 MB.`);
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await f.arrayBuffer()));
    out.push(name);
  }
  return out;
}
