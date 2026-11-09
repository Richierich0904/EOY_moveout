// Central place for school-specific settings. Most of these can be
// overridden with environment variables so the same code works for any school.

export const SCHOOL_NAME = process.env.SCHOOL_NAME ?? "Mercersburg Academy";
export const APP_NAME = process.env.APP_NAME ?? "Le-SWAP";

// The school's time zone. Weeks, months, draw deadlines and every date shown use it.
export const SCHOOL_TZ = process.env.SCHOOL_TZ ?? "America/New_York";

// ---------- launch safety ----------

export const IS_PROD = process.env.NODE_ENV === "production";
// DEMO_MODE=1 lets a production build run with demo data and on-screen codes. Never set it on the real site.
export const DEMO_MODE = process.env.DEMO_MODE === "1";
// Outgoing mail. Either the four plain settings (easiest), or one SMTP_URL line.
// The password itself is only read in src/lib/mail.ts.
export const SMTP_HOST = (process.env.SMTP_HOST ?? "").trim();
export const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "", 10) || 465;
export const SMTP_USER = (process.env.SMTP_USER ?? "").trim();
export const SMTP_URL = (process.env.SMTP_URL ?? "").trim();
export const MAIL_FROM = (process.env.MAIL_FROM ?? "").trim();
/** Is a mail server set up? Until it is, codes can't be emailed. */
export const MAIL_ON = SMTP_HOST !== "" || SMTP_URL !== "";

// Comma-separated list of email domains allowed to sign up.
// Set it to an empty value to allow any email, which only works in development or demo mode.
export const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? "mercersburg.edu")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// What the part before the @ must look like for a student: last name, first initial, class year
// (smithj27). Staff addresses on the same domain have no year, so they can't join as students.
export const STUDENT_EMAIL_PATTERN = new RegExp(process.env.STUDENT_EMAIL_PATTERN ?? "^[a-z][a-z'.-]*[a-z](\\d{2}|\\d{4})$");
// The last name typed at sign-up must match the one in the email. NAME_CHECK=off turns that off.
export const NAME_CHECK = process.env.NAME_CHECK !== "off";

/** On the real site nobody can sign up until the school's email domain and a mail service are set. */
export const SIGNUP_OPEN = !IS_PROD || DEMO_MODE || (MAIL_ON && ALLOWED_EMAIL_DOMAINS.length > 0);
/** Codes are only ever shown on screen while developing or demoing, and only when no mail service is set. */
export const SHOW_CODES_ON_SCREEN = !MAIL_ON && (!IS_PROD || DEMO_MODE);

export const HOUSES = (process.env.HOUSES ?? "Main,Tippetts,Keil,Culberson,Fowle,South,Swank")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

export const CATEGORIES = [
  { slug: "dorm", label: "Dorm & room", kg: 2.5 },
  { slug: "furniture", label: "Furniture", kg: 12 },
  { slug: "textbooks", label: "Textbooks", kg: 1.2 },
  { slug: "clothing", label: "Clothing & uniform", kg: 0.4 },
  { slug: "electronics", label: "Electronics", kg: 2 },
  { slug: "sports", label: "Sports & outdoors", kg: 2 },
  { slug: "music", label: "Music & instruments", kg: 3 },
  { slug: "other", label: "Other", kg: 1 },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function categoryKg(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.kg ?? 1;
}

export const CONDITIONS = ["New", "Like new", "Good", "Fair", "Well loved"] as const;

// "now" = meet up this week. "fall" = item goes into summer storage and is handed over at move-in.
export const HANDOFF = [
  { slug: "now", label: "Meet up now" },
  { slug: "fall", label: "Hand over in the fall" },
] as const;

export const HANDOFF_SPOTS = (
  process.env.HANDOFF_SPOTS ?? "Dining hall entrance,Library steps,Student center,Dorm common room"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const SESSION_DAYS = 30;

// Sign-in safety.
export const CODE_MINUTES = 15;        // how long an emailed code works
export const CODE_ATTEMPTS = 5;        // wrong tries before the code is locked
export const RESEND_SECONDS = 60;      // wait between "send a new code"
export const SIGNUP_EMAILS_PER_HOUR = 3; // sign-up emails to one address, so the form can't flood a classmate
export const UNVERIFIED_DAYS = 7;      // accounts that never entered their code are cleared after this
export const LOGIN_ATTEMPTS = 10;      // failed log-ins per email...
export const LOGIN_WINDOW_MINUTES = 15; // ...in this many minutes

// Text limits.
export const LIMITS = { title: 80, description: 2000, message: 1000, want: 1000, name: 60, course: 20, reason: 200 } as const;
// How much one student can post.
export const RATE = { messagesPer10Min: 30, newChatsPerDay: 15, listingsPerDay: 30, reportsPerDay: 20 } as const;
export const MAX_PHOTOS = 6;

// The adult students can go to. Shown on the help page and to suspended accounts.
export const SAFETY_CONTACT_NAME = process.env.SAFETY_CONTACT_NAME ?? "";
export const SAFETY_CONTACT_EMAIL = process.env.SAFETY_CONTACT_EMAIL ?? "";

// Posts that mention any of these are held until an organiser has looked at them.
export const BANNED_WORDS = (process.env.BANNED_WORDS ??
  "vape,vapes,vaping,juul,nicotine,cigarette,cigarettes,tobacco,zyn,alcohol,beer,vodka,whiskey,liquor,wine,weed,marijuana,cannabis,edibles,thc,drugs,pills,adderall,xanax,ritalin,medication,prescription,knife,knives,gun,guns,firearm,weapon,weapons,ammo,fireworks,taser,pepper spray,fake id")
  .split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);

export const STAFF_NOTICE = `Organisers and school staff can read messages on ${APP_NAME}.`;

// ---------- fun stuff ----------

// Emails that get the organisers pages (reports, messages, draws, credits). Comma-separated.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

// How many confirmed giveaways earn one entry in the giveaway draw.
export const GIVEAWAYS_PER_TICKET = Math.max(1, parseInt(process.env.GIVEAWAYS_PER_TICKET ?? "3", 10) || 3);

// Credits are earned, never bought, and can't be sent to anyone or turned into money.
// 100 = one credit, shown as "⭐ 1". Students spend them to boost a listing to the top of the shelves.
export const BOOST_COST = 300;          // ⭐3 for one boost
export const BOOST_DAYS = 3;            // how long a boost lasts
export const CREDIT_PER_HANDOFF = 100;  // ⭐1 for every confirmed handoff that counts
export const WELCOME_CREDITS = 300;     // enough for one boost, given when a student verifies

// Fair play. A confirmed handoff only counts for points, entries and credits within these limits.
export const PAIR_CAP_PER_MONTH = 2;    // counted handoffs between the same two students per month
export const DAILY_COUNT_CAP = 5;       // counted handoffs per seller per day

export const BADGES = [
  { slug: "giver", emoji: "🎁", label: "Giver", desc: "Gave away your first item" },
  { slug: "generous", emoji: "💛", label: "Generous", desc: "Gave away 5 items" },
  { slug: "rehomer", emoji: "🌱", label: "Rehomer", desc: "Rehomed 10 items in total" },
  { slug: "bookworm", emoji: "📚", label: "Textbook hero", desc: "Passed on 3 textbooks" },
  { slug: "summer", emoji: "🍂", label: "Summer saver", desc: "Handed something over across the summer" },
  { slug: "lucky", emoji: "🎟️", label: "Lucky", desc: "Won a draw" },
  { slug: "early", emoji: "🚀", label: "Early adopter", desc: "One of the first 50 members" },
  { slug: "streak", emoji: "🔥", label: "On a roll", desc: "Rehomed something 3 weeks in a row" },
  { slug: "weekly", emoji: "🏅", label: "Weekly champion", desc: "Finished a week at #1" },
  { slug: "monthly", emoji: "🥇", label: "Monthly champion", desc: "Finished a month in the top 3" },
  { slug: "yearly", emoji: "🏆", label: "Year champion", desc: "Finished a school year in the top 3" },
] as const;

// Points for a handoff the other person confirmed. Giving something away is worth more than selling it.
export const POINTS_GIVEAWAY = 3;
export const POINTS_SALE = 2;

// Credits paid automatically to the top finishers of each finished period (in cents; 100 = one credit).
export const RANK_PRIZES: Record<"week" | "month" | "year", number[]> = {
  week: [500],
  month: [1500, 1000, 500],
  year: [5000, 3000, 2000],
};
