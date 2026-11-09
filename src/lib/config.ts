// Central place for school-specific settings. Most of these can be
// overridden with environment variables so the same code works for any school.

export const SCHOOL_NAME = process.env.SCHOOL_NAME ?? "Our School";
export const APP_NAME = process.env.APP_NAME ?? "Le-SWAP";

// Comma-separated list of email domains allowed to sign up, e.g. "students.school.edu,school.edu".
// Empty means any email is allowed (handy for local development).
export const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

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
  process.env.HANDOFF_SPOTS ?? "Dining hall entrance,Library steps,Student center,My dorm"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const SESSION_DAYS = 30;

// ---------- fun stuff ----------

// Emails that get the /admin page (create draws, grant credits). Comma-separated.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

// How many confirmed giveaways earn one lottery ticket.
export const GIVEAWAYS_PER_TICKET = Math.max(1, parseInt(process.env.GIVEAWAYS_PER_TICKET ?? "3", 10) || 3);

// Credits are an in-app currency. 100 = one credit, shown as "⭐ 1". Sellers can opt in to accept them.
export const CREDIT_NAME = process.env.CREDIT_NAME ?? "credits";

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
