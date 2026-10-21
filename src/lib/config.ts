// Central place for school-specific settings. Most of these can be
// overridden with environment variables so the same code works for any school.

export const SCHOOL_NAME = process.env.SCHOOL_NAME ?? "Our School";
export const APP_NAME = process.env.APP_NAME ?? "Swap";

// Comma-separated list of email domains allowed to sign up, e.g. "students.school.edu,school.edu".
// Empty means any email is allowed (handy for local development).
export const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const HOUSES = (process.env.HOUSES ?? "North,South,East,West,Day Student")
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
