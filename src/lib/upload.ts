import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { UPLOAD_DIR } from "./db";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1600;

/** Save uploaded photos and return their stored file names.
 *
 *  Every photo is decoded and saved again as a fresh WebP. That does three things:
 *  it proves the file really is an image (whatever the browser claimed), it drops hidden
 *  data such as the GPS location and phone model, and it keeps files small. */
export async function saveImages(files: File[]): Promise<string[]> {
  const out: string[] = [];
  try {
    for (const f of files) {
      if (!f || f.size === 0) continue;
      if (f.size > MAX_BYTES) throw new Error(`"${f.name}" is over 8 MB. Try a smaller photo.`);
      let clean: Buffer;
      try {
        clean = await sharp(Buffer.from(await f.arrayBuffer()), { failOn: "error", limitInputPixels: 50_000_000 })
          .rotate() // turn the photo upright using its orientation tag, before the tag is dropped
          .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        throw new Error(`We couldn't read "${f.name}". Use a JPG or PNG photo.`);
      }
      const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.webp`;
      await fs.writeFile(path.join(UPLOAD_DIR, name), clean);
      out.push(name);
    }
  } catch (e) {
    await deleteImages(out); // don't leave half an upload behind
    throw e;
  }
  return out;
}

/** Remove stored photos from disk. Missing files are ignored. */
export async function deleteImages(files: (string | null | undefined)[]) {
  for (const f of files) {
    if (!f || !/^[\w.-]+$/.test(f)) continue;
    await fs.rm(path.join(UPLOAD_DIR, f), { force: true });
  }
}
