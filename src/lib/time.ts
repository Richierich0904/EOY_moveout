// Dates in the school's own time zone. The database stores UTC ("YYYY-MM-DD HH:MM:SS");
// everything a student sees, and every week or month boundary, uses SCHOOL_TZ.

import { SCHOOL_TZ } from "./config";

const pad = (n: number) => String(n).padStart(2, "0");

/** SQLite's datetime('now') format, so plain string comparison works. */
export function sqlTime(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** Read a time from the database (or an ISO string) as a Date. */
export function parseSql(s: string) {
  return new Date(s.endsWith("Z") ? s : s.replace(" ", "T") + "Z");
}

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHOOL_TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
});

export type Parts = { y: number; m: number; d: number; h: number; mi: number; s: number; dow: number };

/** The wall-clock date and time at the school for a moment in time. Months are 0-based, like Date. */
export function zonedParts(at = new Date()): Parts {
  const p: Record<string, number> = {};
  for (const x of partsFmt.formatToParts(at)) if (x.type !== "literal") p[x.type] = Number(x.value);
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  return { y: p.year, m: p.month - 1, d: p.day, h: p.hour, mi: p.minute, s: p.second, dow };
}

function offsetMs(at: Date) {
  const p = zonedParts(at);
  return Date.UTC(p.y, p.m, p.d, p.h, p.mi, p.s) - Math.floor(at.getTime() / 1000) * 1000;
}

/** The moment in time for a wall-clock date at the school. Out-of-range days and months roll over, like Date.UTC. */
export function zonedToUtc(y: number, m: number, d: number, h = 0, mi = 0, s = 0): Date {
  const guess = Date.UTC(y, m, d, h, mi, s);
  const first = offsetMs(new Date(guess));
  let t = guess - first;
  const second = offsetMs(new Date(t));
  if (second !== first) t = guess - second;
  return new Date(t);
}

/** Midnight at the school at the start of today (or `daysBack` days ago). */
export function startOfSchoolDay(daysBack = 0, at = new Date()) {
  const p = zonedParts(at);
  return zonedToUtc(p.y, p.m, p.d - daysBack);
}

/** The first moment of the current month at the school. */
export function startOfSchoolMonth(at = new Date()) {
  const p = zonedParts(at);
  return zonedToUtc(p.y, p.m, 1);
}

const asDate = (v: Date | string) => (typeof v === "string" ? parseSql(v) : v);

export function fmtDate(v: Date | string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return asDate(v).toLocaleDateString("en-US", { ...opts, timeZone: SCHOOL_TZ });
}

export function fmtDateTime(v: Date | string) {
  return asDate(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: SCHOOL_TZ });
}

/** Parse a `datetime-local` value ("2026-05-20T17:00") as school time. */
export function parseSchoolLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  return zonedToUtc(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

/** A `datetime-local` value for a moment in time, in school time. */
export function toSchoolLocal(at: Date) {
  const p = zonedParts(at);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** Whole days until `end`, as "ends today" or "N days left". */
export function daysLeft(end: Date) {
  const d = Math.ceil((end.getTime() - Date.now()) / 86400_000);
  return d <= 1 ? "ends today" : `${d} days left`;
}
