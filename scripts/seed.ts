// Demo data so the app isn't empty on first run.
//   npm run seed    adds demo students and listings (skips if they already exist)
//   npm run reset   wipes the local database and photos, then adds fresh demo data
// All demo accounts use the password: password123
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { getDb, UPLOAD_DIR } from "../src/lib/db";
import { fanOutNewListing } from "../src/lib/social";
import { demoArt } from "./demo-art";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
if (process.argv.includes("--fresh")) {
  // Local development only: never wipe a hosted database.
  if (process.env.NODE_ENV === "production" || process.env.DATA_DIR) {
    console.error("Refusing to reset: this looks like a hosted database (NODE_ENV=production or DATA_DIR is set).");
    process.exit(1);
  }
  for (const f of ["app.db", "app.db-wal", "app.db-shm"]) fs.rmSync(path.join(DATA_DIR, f), { force: true });
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
  console.log("Cleared the local database and photos.");
}

const db = getDb();
if (db.prepare("SELECT 1 FROM users WHERE email LIKE '%@demo.school'").get()) {
  console.log("Demo data is already here. Run `npm run reset` to start over with fresh demo data.");
  process.exit(0);
}

/** Write a drawn product shot for a demo listing, in the site's black-and-grey palette. */
function image(i: number, title: string) {
  const name = `demo-${i}.svg`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), demoArt(title));
  return name;
}

const hash = bcrypt.hashSync("password123", 10);
const users = [
  ["maya@demo.school", "Maya Chen", "Tippetts", 2026], ["leo@demo.school", "Leo Okafor", "South", 2027],
  ["sofia@demo.school", "Sofia Rossi", "Keil", 2026], ["jamal@demo.school", "Jamal Hart", "Fowle", 2028],
  ["aiko@demo.school", "Aiko Tanaka", "Swank", 2029],
] as const;
const ins = db.prepare("INSERT INTO users (email, name, house, grad_year, password_hash, verified, rules_accepted_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))");
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
  [1, "Full-length mirror", "Plastic frame, no cracks. Can bring it to the student center.", "dorm", 500, "Good", null, "now", "available", 3],
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
  // recent handoffs, so this week's and this month's rankings and the progress charts have data
  [2, "Shower caddy", "", "dorm", 0, "Good", null, "now", "sold", 1],
  [4, "Desk organiser", "", "dorm", 0, "Good", null, "now", "sold", 2],
  [0, "Clip-on reading light", "", "dorm", 600, "Good", null, "now", "sold", 3],
  [3, "Yoga mat", "", "sports", 0, "Fair", null, "now", "sold", 8],
  [0, "French 2 workbook", "", "textbooks", 0, "Good", "FREN 200", "now", "sold", 9],
  [2, "Throw pillow", "", "dorm", 300, "Good", null, "now", "sold", 10],
  [4, "Laundry hamper", "", "dorm", 0, "Good", null, "now", "sold", 15],
  [0, "Kettle", "", "electronics", 800, "Good", null, "now", "sold", 17],
  [1, "Poster frames (3)", "", "dorm", 0, "Good", null, "now", "sold", 21],
];
const insL = db.prepare(`INSERT INTO listings (user_id, title, description, category, price_cents, condition, course_code, handoff, status, created_at, closed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), CASE WHEN ? = 'sold' THEN datetime('now', ?) ELSE NULL END)`);
const insI = db.prepare("INSERT INTO listing_images (listing_id, file, position) VALUES (?, ?, 0)");
listings.forEach((l, i) => {
  const ago = `-${l[9]} days`;
  const id = Number(insL.run(uid[l[0]], l[1], l[2], l[3], l[4], l[5], l[6], l[7], l[8], ago, l[8], ago).lastInsertRowid);
  if (l[8] === "available") insI.run(id, image(i, l[1]));
});

const insW = db.prepare("INSERT INTO wants (user_id, title, description, category, max_price_cents) VALUES (?, ?, ?, ?, ?)");
insW.run(uid[4], "Mini fridge for next year", "Incoming boarder, can collect at move-in in September.", "dorm", 4000);
insW.run(uid[3], "MATH 301 textbook", "Stewart calculus, any recent edition.", "textbooks", 2500);
insW.run(uid[1], "Bike, any condition", "Just needs to roll. Will fix it up.", "sports", null);
insW.run(uid[2], "Standing desk lamp", "", "dorm", 1500);

// Confirmed handoffs (so the draw has entrants and the rankings have points) and a running draw.
const soldRows = db.prepare("SELECT id, user_id FROM listings WHERE status = 'sold' ORDER BY id").all() as { id: number; user_id: number }[];
soldRows.forEach((l, i) => {
  const receiver = uid[(uid.indexOf(l.user_id) + 1) % uid.length];
  // Most receivers have confirmed; every 4th handoff is still waiting, to show the "waiting to be confirmed" state.
  db.prepare("UPDATE listings SET buyer_id = ?, received_at = CASE WHEN ? % 4 != 3 THEN closed_at ELSE NULL END WHERE id = ?").run(receiver, i, l.id);
});
db.prepare("UPDATE listings SET price_cents = 0 WHERE status = 'sold' AND user_id = ?").run(uid[1]); // Leo gave everything away
db.prepare("UPDATE listings SET price_cents = 0 WHERE id = (SELECT MIN(id) FROM listings WHERE status = 'sold' AND user_id = ?)").run(uid[3]);
const draw = db.prepare("INSERT INTO draws (title, description, starts_at, ends_at) VALUES (?, ?, datetime('now','-90 days'), datetime('now','+14 days'))")
  .run("Autumn giveaway draw", "Every 3 items you give away earns an entry. Winners announced at the last dorm meeting of term.");
const insP = db.prepare("INSERT INTO prizes (draw_id, title, credit_cents, position) VALUES (?, ?, ?, ?)");
insP.run(draw.lastInsertRowid, "$25 school store voucher", 0, 0);
insP.run(draw.lastInsertRowid, "10 credits, enough for three boosts", 1000, 1);
insP.run(draw.lastInsertRowid, "Skip-the-queue pass for move-out storage", 0, 2);
// Credits: everyone starts with enough for one boost, plus one for each confirmed handoff so far.
const credit = db.prepare("INSERT INTO credit_transactions (user_id, delta, reason) VALUES (?, ?, ?)");
for (const id of uid) {
  credit.run(id, 300, "Welcome gift: enough for your first boost");
  const n = (db.prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold' AND received_at IS NOT NULL").get(id) as { c: number }).c;
  if (n > 0) credit.run(id, n * 100, `${n} confirmed handoff${n === 1 ? "" : "s"}`);
}
// Sofia is boosting her bookshelf, so the shelves show what a boost looks like.
const boosted = db.prepare("SELECT id, title FROM listings WHERE status = 'available' AND user_id = ? AND title LIKE 'Bookshelf%'").get(uid[2]) as { id: number; title: string };
db.prepare("UPDATE listings SET boosted_until = datetime('now', '+3 days') WHERE id = ?").run(boosted.id);
db.prepare("INSERT INTO credit_transactions (user_id, delta, reason, listing_id) VALUES (?, ?, ?, ?)").run(uid[2], -300, `Boosted "${boosted.title}" for 3 days`, boosted.id);

// A couple of conversations, so messages and "who did it go to" have something in them.
const thread = db.prepare("INSERT INTO threads (listing_id, user_a, user_b) VALUES (?, ?, ?)");
const msg = db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)");
const fridge = db.prepare("SELECT id FROM listings WHERE status = 'available' AND title LIKE 'Mini fridge, 1.7%'").get() as { id: number };
const t1 = Number(thread.run(fridge.id, uid[0], uid[4]).lastInsertRowid);
msg.run(t1, uid[4], "Hi Maya! Is the fridge still available? I could collect it at move-in.");
msg.run(t1, uid[0], "Yes, it's yours if you want it. Dining hall entrance on move-in day?");

db.prepare("INSERT INTO saved_searches (user_id, query, category, free_only, max_price_cents) VALUES (?, ?, ?, ?, ?)").run(uid[4], "fridge", null, 0, null);
db.prepare("INSERT INTO saved_searches (user_id, query, category, free_only, max_price_cents) VALUES (?, ?, ?, ?, ?)").run(uid[3], "", "textbooks", 0, 2500);

// Trigger alerts for the newest listing so the notifications page has something in it.
const newest = db.prepare("SELECT id FROM listings WHERE status = 'available' ORDER BY created_at DESC LIMIT 1").get() as { id: number };
fanOutNewListing(newest.id);

console.log(`Seeded ${users.length} users, ${listings.length} listings, 4 wanted posts.`);
console.log("Set ADMIN_EMAILS=maya@demo.school to try the organisers pages.");
console.log("Log in as any of: " + users.map((u) => u[0]).join(", ") + "  (password: password123)");
