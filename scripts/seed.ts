// Demo data so the app isn't empty on first run.
//   npm run seed          (adds demo users/listings; safe to re-run, it skips if demo users exist)
// All demo accounts use the password: password123
import path from "node:path";
import fs from "node:fs";
import zlib from "node:zlib";
import bcrypt from "bcryptjs";
import { getDb, UPLOAD_DIR } from "../src/lib/db";
import { fanOutNewListing } from "../src/lib/social";

const db = getDb();
if (db.prepare("SELECT 1 FROM users WHERE email LIKE '%@demo.school'").get()) {
  console.log("Demo data already present. Delete data/app.db to start fresh.");
  process.exit(0);
}

// --- tiny PNG writer so listings have cover images without shipping binary files ---
function crc32(buf: Buffer) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w: number, h: number, color: [number, number, number], color2: [number, number, number]) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const t = (x + y) / (w + h);
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = Math.round(color[0] * (1 - t) + color2[0] * t);
      raw[o + 1] = Math.round(color[1] * (1 - t) + color2[1] * t);
      raw[o + 2] = Math.round(color[2] * (1 - t) + color2[2] * t);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const PALETTE: [number, number, number][][] = [
  [[244, 211, 94], [224, 122, 95]], [[129, 178, 154], [61, 90, 128]], [[242, 204, 143], [224, 122, 95]], [[61, 90, 128], [152, 193, 217]],
  [[214, 69, 69], [255, 176, 136]], [[31, 111, 74], [129, 178, 154]], [[120, 100, 160], [200, 180, 230]], [[80, 80, 80], [190, 190, 190]],
];
function image(i: number) {
  const name = `demo-${i}.png`;
  const [a, b] = PALETTE[i % PALETTE.length];
  fs.writeFileSync(path.join(UPLOAD_DIR, name), png(600, 600, a, b));
  return name;
}

const hash = bcrypt.hashSync("password123", 10);
const users = [
  ["maya@demo.school", "Maya Chen", "North", 2026], ["leo@demo.school", "Leo Okafor", "South", 2027],
  ["sofia@demo.school", "Sofia Rossi", "East", 2026], ["jamal@demo.school", "Jamal Hart", "West", 2028],
  ["aiko@demo.school", "Aiko Tanaka", "North", 2029],
] as const;
const ins = db.prepare("INSERT INTO users (email, name, house, grad_year, password_hash, verified) VALUES (?, ?, ?, ?, ?, 1)");
const uid = users.map((u) => Number(ins.run(u[0], u[1], u[2], u[3], hash).lastInsertRowid));

type L = [user: number, title: string, desc: string, cat: string, price: number, cond: string, course: string | null, handoff: "now" | "fall", status: "available" | "sold", daysAgo: number];
const listings: L[] = [
  [0, "Mini fridge, 1.7 cu ft", "Works perfectly, a bit of frost build-up. Perfect under-desk size. Leaving in June so it needs a new home.", "dorm", 4000, "Good", null, "fall", "available", 1],
  [1, "Desk fan, 12 inch", "Three speeds, oscillates. Loud-ish on high but you'll be grateful in September.", "dorm", 800, "Good", null, "now", "available", 2],
  [2, "AP Chemistry textbook (Zumdahl, 10th ed)", "Some highlighting in chapters 1-6. No torn pages.", "textbooks", 2500, "Good", "CHEM 300", "now", "available", 0],
  [0, "Calculus: Early Transcendentals (Stewart)", "Clean copy, barely opened (sorry Mr. Hale).", "textbooks", 3000, "Like new", "MATH 301", "now", "available", 3],
  [3, "Grey rug 5x7", "Soft, no stains, vacuumed. Makes a dorm feel like a room.", "dorm", 0, "Good", null, "now", "available", 1],
  [1, "String lights (2 sets)", "USB powered, warm white. Free, just come get them.", "dorm", 0, "Like new", null, "now", "available", 4],
  [2, "Bookshelf, 3 tiers, white", "Flat-pack, I'll help carry it. Slight wobble, tighten the screws.", "furniture", 1500, "Fair", null, "fall", "available", 2],
  [4, "Winter formal dress, navy, size S", "Worn once. Dry-cleaned.", "clothing", 3500, "Like new", null, "now", "available", 5],
  [3, "Lacrosse stick (STX Stallion)", "Restrung this season. Moving to rowing.", "sports", 4500, "Good", null, "now", "available", 6],
  [0, "Beats Solo3 headphones", "Battery still lasts ages. Includes case.", "electronics", 5000, "Good", null, "now", "available", 0],
  [4, "Yamaha acoustic guitar + bag", "Starter guitar, a few scratches. Comes with picks and a clip-on tuner.", "music", 6000, "Fair", null, "fall", "available", 7],
  [1, "Full-length mirror", "Plastic frame, no cracks. Pickup from South.", "dorm", 500, "Good", null, "now", "available", 3],
  [2, "Noise-cancelling earbuds (Anker)", "Lost the left ear tip, otherwise perfect.", "electronics", 1500, "Fair", null, "now", "available", 8],
  [3, "Physics: Principles with Applications (Giancoli)", "Needed for PHYS 200. Good condition.", "textbooks", 2000, "Good", "PHYS 200", "now", "available", 9],
  // already rehomed, so the impact page and price suggestions have data
  [0, "Mini fridge", "", "dorm", 3500, "Good", null, "now", "sold", 30],
  [1, "Mini fridge (black)", "", "dorm", 4500, "Good", null, "now", "sold", 40],
  [2, "Desk lamp", "", "dorm", 1000, "Good", null, "now", "sold", 35],
  [3, "Desk chair", "", "furniture", 2000, "Good", null, "now", "sold", 50],
  [4, "Bean bag", "", "furniture", 0, "Good", null, "now", "sold", 45],
  [0, "AP Bio textbook", "", "textbooks", 2000, "Good", "BIO 300", "now", "sold", 60],
  [1, "Spanish 3 textbook", "", "textbooks", 1500, "Good", "SPAN 300", "now", "sold", 61],
  [2, "US History textbook", "", "textbooks", 1800, "Good", "HIST 200", "now", "sold", 62],
  [3, "School blazer, size M", "", "clothing", 2500, "Good", null, "now", "sold", 70],
  [4, "Hockey skates, size 9", "", "sports", 3000, "Good", null, "now", "sold", 80],
];
const insL = db.prepare(`INSERT INTO listings (user_id, title, description, category, price_cents, condition, course_code, handoff, status, created_at, closed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), CASE WHEN ? = 'sold' THEN datetime('now', ?) ELSE NULL END)`);
const insI = db.prepare("INSERT INTO listing_images (listing_id, file, position) VALUES (?, ?, 0)");
listings.forEach((l, i) => {
  const ago = `-${l[9]} days`;
  const id = Number(insL.run(uid[l[0]], l[1], l[2], l[3], l[4], l[5], l[6], l[7], l[8], ago, l[8], ago).lastInsertRowid);
  if (l[8] === "available") insI.run(id, image(i));
});

const insW = db.prepare("INSERT INTO wants (user_id, title, description, category, max_price_cents) VALUES (?, ?, ?, ?, ?)");
insW.run(uid[4], "Mini fridge for next year", "Incoming boarder, can collect at move-in in September.", "dorm", 4000);
insW.run(uid[3], "MATH 301 textbook", "Stewart calculus, any recent edition.", "textbooks", 2500);
insW.run(uid[1], "Bike, any condition", "Just needs to roll. Will fix it up.", "sports", null);
insW.run(uid[2], "Standing desk lamp", "", "dorm", 1500);

// Confirmed giveaways (so the draw has entrants) and a running draw.
const soldRows = db.prepare("SELECT id, user_id FROM listings WHERE status = 'sold' ORDER BY id").all() as { id: number; user_id: number }[];
soldRows.forEach((l, i) => {
  const receiver = uid[(uid.indexOf(l.user_id) + 1) % uid.length];
  // Most receivers have confirmed; every 4th handoff is still waiting, to show the "nudge" state.
  db.prepare("UPDATE listings SET buyer_id = ?, received_at = CASE WHEN ? % 4 != 3 THEN closed_at ELSE NULL END WHERE id = ?").run(receiver, i, l.id);
});
db.prepare("UPDATE listings SET price_cents = 0 WHERE status = 'sold' AND user_id = ?").run(uid[1]); // Leo gave everything away
db.prepare("UPDATE listings SET price_cents = 0 WHERE id = (SELECT MIN(id) FROM listings WHERE status = 'sold' AND user_id = ?)").run(uid[3]);
const draw = db.prepare("INSERT INTO draws (title, description, starts_at, ends_at) VALUES (?, ?, datetime('now','-90 days'), datetime('now','+14 days'))")
  .run("Autumn giveaway draw", "Every 3 items you give away earns a ticket. Drawn at the last house meeting of term.");
const insP = db.prepare("INSERT INTO prizes (draw_id, title, credit_cents, position) VALUES (?, ?, ?, ?)");
insP.run(draw.lastInsertRowid, "$25 school store voucher", 0, 0);
insP.run(draw.lastInsertRowid, "20 credits to spend on the app", 2000, 1);
insP.run(draw.lastInsertRowid, "Skip-the-queue pass for move-out storage", 0, 2);
db.prepare("INSERT INTO credit_transactions (user_id, delta, reason) VALUES (?, ?, ?)").run(uid[4], 1500, "Welcome bonus from the organisers");
db.prepare("UPDATE listings SET accepts_credits = 1 WHERE status = 'available' AND price_cents BETWEEN 500 AND 1500").run();

db.prepare("INSERT INTO saved_searches (user_id, query, category, free_only, max_price_cents) VALUES (?, ?, ?, ?, ?)").run(uid[4], "fridge", null, 0, null);
db.prepare("INSERT INTO saved_searches (user_id, query, category, free_only, max_price_cents) VALUES (?, ?, ?, ?, ?)").run(uid[3], "", "textbooks", 0, 2500);

// Trigger alerts for the newest listing so the notifications page has something in it.
const newest = db.prepare("SELECT id FROM listings WHERE status = 'available' ORDER BY created_at DESC LIMIT 1").get() as { id: number };
fanOutNewListing(newest.id);

console.log(`Seeded ${users.length} users, ${listings.length} listings, 4 wanted posts.`);
console.log("Set ADMIN_EMAILS=maya@demo.school to try the organisers page.");
console.log("Log in as any of: " + users.map((u) => u[0]).join(", ") + "  (password: password123)");
