// Who may join, worked out from the school email address.
//
// A Mercersburg student address is: last name, first initial, graduation year, then the school
// domain. For example smithj27@mercersburg.edu is J. Smith, class of 2027.
// Organisers (ADMIN_EMAILS) are adults and may have any address on record.

import { ADMIN_EMAILS, ALLOWED_EMAIL_DOMAINS, NAME_CHECK, STUDENT_EMAIL_PATTERN } from "./config";

export type StudentEmail = { last: string; initial: string; gradYear: number };

const isOrganiser = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());

/** Read the last name, first initial and graduation year out of a student address. */
export function parseStudentEmail(email: string): StudentEmail | null {
  const local = email.toLowerCase().split("@")[0] ?? "";
  // The last letter before the digits is the first initial; everything before it is the last name.
  const m = /^([a-z][a-z'.-]*)([a-z])(\d{2}|\d{4})$/.exec(local);
  if (!m) return null;
  const year = Number(m[3]);
  return { last: m[1], initial: m[2], gradYear: year < 100 ? 2000 + year : year };
}

/** Why this address can't join, or null if it can. */
export function emailProblem(email: string, now = new Date()): string | null {
  const e = email.toLowerCase();
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return null; // any address: local development only
  const [local, domain] = e.split("@");
  const domains = ALLOWED_EMAIL_DOMAINS.map((d) => "@" + d).join(" or ");
  if (!domain || !ALLOWED_EMAIL_DOMAINS.includes(domain)) return `Use your school email (${domains}).`;
  if (isOrganiser(e)) return null;
  if (!STUDENT_EMAIL_PATTERN.test(local)) return `Use your student email. It looks like your last name, first initial and class year, for example smithj27${"@" + ALLOWED_EMAIL_DOMAINS[0]}.`;
  const parsed = parseStudentEmail(e);
  if (parsed) {
    const y = now.getFullYear();
    if (parsed.gradYear < y - 1 || parsed.gradYear > y + 8) return "That class year isn't a current student's. Check your email address.";
  }
  return null;
}

/** The graduation year to store: read from the email, or 0 for staff. */
export function gradYearFor(email: string): number {
  return parseStudentEmail(email)?.gradYear ?? 0;
}

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
/** Letters only: no capitals, accents, spaces, hyphens or apostrophes. */
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

/** Does the typed name end in the last name the school email carries?
 *  First names are free, so nicknames work. Returns true when there is nothing to check against. */
export function nameMatchesEmail(name: string, email: string): boolean {
  if (!NAME_CHECK || isOrganiser(email)) return true;
  const parsed = parseStudentEmail(email);
  if (!parsed) return true;
  const last = plain(parsed.last);
  const parts = name.trim().split(/[\s-]+/).filter((w) => plain(w) && !SUFFIXES.has(plain(w)));
  // Any run of name parts after the first name may be the last name: "Ana de la Cruz", "Sam Smith-Jones".
  for (let i = 1; i < parts.length; i++) {
    for (let j = i; j < parts.length; j++) {
      const candidate = plain(parts.slice(i, j + 1).join(""));
      if (candidate === last) return true;
      // Schools sometimes cut long last names short in the address.
      if (last.length >= 8 && candidate.startsWith(last)) return true;
    }
  }
  return false;
}

/** "Smith" from smithj27@..., for error messages. */
export function lastNameHint(email: string): string {
  const p = parseStudentEmail(email);
  return p ? p.last.charAt(0).toUpperCase() + p.last.slice(1) : "";
}
