"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { checkPassword, createSession, destroyAllSessions, destroySession, getCurrentUser, hashPassword, makeVerifyCode, safeNext, sameCode } from "@/lib/auth";
import { emailProblem, gradYearFor, lastNameHint, nameMatchesEmail } from "@/lib/student-email";
import {
  CODE_ATTEMPTS, CODE_MINUTES, HOUSES, LIMITS, LOGIN_ATTEMPTS, LOGIN_WINDOW_MINUTES,
  RESEND_SECONDS, SHOW_CODES_ON_SCREEN, SIGNUP_EMAILS_PER_HOUR, SIGNUP_OPEN, WELCOME_CREDITS,
} from "@/lib/config";
import { sendCode } from "@/lib/mail";
import { clear, hits, record } from "@/lib/limits";
import { addCredits } from "@/lib/game";

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

const EXPIRES = `+${CODE_MINUTES} minutes`;

export async function signup(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!SIGNUP_OPEN) return { error: "Sign-up is not open yet. Ask the organisers when it will be." };
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name").replace(/\s+/g, " ");
  const house = str(fd, "house");
  const password = String(fd.get("password") ?? "");

  if (email.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email." };
  const problem = emailProblem(email);
  if (problem) return { error: problem };
  if (name.length < 2 || !/\S\s+\S/.test(name)) return { error: "Enter your first and last name." };
  if (name.length > LIMITS.name) return { error: `Name is too long (${LIMITS.name} characters max).` };
  if (!nameMatchesEmail(name, email)) return { error: `Use your real last name. It should match the one in your school email (${lastNameHint(email)}). If that's wrong for you, ask an organiser.` };
  if (!HOUSES.includes(house)) return { error: "Pick your dorm." };
  // The class year is read from the email address, so nobody can claim the wrong one.
  const gradYear = gradYearFor(email);
  if (password.length < 8) return { error: "Password needs at least 8 characters." };
  if (password.length > 72) return { error: "Password is too long (72 characters max)." };
  if (fd.get("rules") !== "on") return { error: "Please read and agree to the rules first." };

  const db = getDb();
  const existing = db.prepare("SELECT id, verified FROM users WHERE email = ?").get(email) as { id: number; verified: number } | undefined;
  if (existing?.verified) return { error: "That email already has an account. Try logging in." };
  // Only so many sign-up emails go to one address, so this form can't be used to flood a classmate's inbox.
  const sent = `signup:${email}`;
  if (hits(sent, 3600) >= SIGNUP_EMAILS_PER_HOUR) return { error: "A few sign-up emails have already gone to that address. Use the newest code, or try again in an hour." };
  record(sent);
  // A sign-up that was started but never finished (maybe by someone else) doesn't hold the address.
  // Only the person who can read the inbox can finish, so the newest attempt simply replaces it.
  if (existing) db.prepare("DELETE FROM users WHERE id = ? AND verified = 0").run(existing.id);

  const code = makeVerifyCode();
  const r = db.prepare(
    `INSERT INTO users (email, name, house, grad_year, password_hash, verify_code, verify_expires_at, verify_sent_at, rules_accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now'), datetime('now'))`)
    .run(email, name, house, gradYear, await hashPassword(password), code, EXPIRES);
  if (!(await sendCode(email, code, "verify", CODE_MINUTES))) {
    db.prepare("DELETE FROM users WHERE id = ?").run(r.lastInsertRowid);
    return { error: "We couldn't send the email. Check the address and try again in a minute." };
  }
  await createSession(Number(r.lastInsertRowid));
  redirect("/verify");
}

export async function verify(_prev: FormState, fd: FormData): Promise<FormState> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  if (u.verified) redirect("/");
  const code = str(fd, "code");
  const db = getDb();
  const row = db.prepare("SELECT verify_code, verify_attempts, (verify_expires_at IS NULL OR verify_expires_at > datetime('now')) AS live FROM users WHERE id = ?").get(u.id) as
    { verify_code: string | null; verify_attempts: number; live: number };
  if (!row.verify_code) return { error: "Ask for a new code below." };
  if (!row.live) return { error: "That code has expired. Send a new one below." };
  if (row.verify_attempts >= CODE_ATTEMPTS) return { error: "Too many wrong tries. Send a new code below." };
  if (!sameCode(row.verify_code, code)) {
    db.prepare("UPDATE users SET verify_attempts = verify_attempts + 1 WHERE id = ?").run(u.id);
    const left = CODE_ATTEMPTS - row.verify_attempts - 1;
    return { error: left > 0 ? `That code doesn't match. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Send a new code below." };
  }
  db.transaction(() => {
    db.prepare("UPDATE users SET verified = 1, verify_code = NULL, verify_expires_at = NULL, verify_attempts = 0 WHERE id = ?").run(u.id);
    if (WELCOME_CREDITS > 0) addCredits(u.id, WELCOME_CREDITS, "Welcome gift: enough for your first boost");
  })();
  redirect("/?welcome=1");
}

export async function resendCode(): Promise<FormState> {
  const u = await getCurrentUser();
  if (!u || u.verified) return undefined;
  const db = getDb();
  const recent = db.prepare("SELECT 1 FROM users WHERE id = ? AND verify_sent_at > datetime('now', ?)").get(u.id, `-${RESEND_SECONDS} seconds`);
  if (recent) return { error: `Give it a minute. You can ask for a new code every ${RESEND_SECONDS} seconds.` };
  const code = makeVerifyCode();
  db.prepare("UPDATE users SET verify_code = ?, verify_expires_at = datetime('now', ?), verify_attempts = 0, verify_sent_at = datetime('now') WHERE id = ?").run(code, EXPIRES, u.id);
  if (!(await sendCode(u.email, code, "verify", CODE_MINUTES))) return { error: "We couldn't send the email. Try again in a minute." };
  return { ok: true, message: "A new code is on its way." };
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const key = `login:${email}`;
  if (hits(key, LOGIN_WINDOW_MINUTES * 60) >= LOGIN_ATTEMPTS) return { error: `Too many tries. Wait ${LOGIN_WINDOW_MINUTES} minutes, or reset your password.` };
  const row = getDb().prepare("SELECT id, password_hash, verified FROM users WHERE email = ?").get(email) as
    { id: number; password_hash: string; verified: number } | undefined;
  if (!row || !(await checkPassword(password, row.password_hash))) {
    record(key);
    return { error: "Wrong email or password." };
  }
  clear(key);
  await createSession(row.id);
  redirect(row.verified ? safeNext(fd.get("next")) : "/verify");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- password reset ----------

/** Step 1: email a reset code. The answer is the same whether or not the address has an account. */
export async function requestReset(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter your school email." };
  const key = `reset:${email}`;
  if (hits(key, 15 * 60) < 3) {
    record(key);
    const db = getDb();
    const u = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
    if (u) {
      const code = makeVerifyCode();
      db.prepare("UPDATE users SET reset_code = ?, reset_expires_at = datetime('now', ?), reset_attempts = 0 WHERE id = ?").run(code, EXPIRES, u.id);
      await sendCode(email, code, "reset", CODE_MINUTES);
    }
  }
  redirect(`/reset?email=${encodeURIComponent(email)}`);
}

/** Step 2: the code plus a new password. Signs the student out everywhere else. */
export async function resetPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const code = str(fd, "code");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Password needs at least 8 characters." };
  if (password.length > 72) return { error: "Password is too long (72 characters max)." };
  const db = getDb();
  const u = db.prepare("SELECT id, verified, reset_code, reset_attempts, (reset_expires_at > datetime('now')) AS live FROM users WHERE email = ?").get(email) as
    { id: number; verified: number; reset_code: string | null; reset_attempts: number; live: number | null } | undefined;
  const bad = { error: "That code doesn't match or has expired. Ask for a new one." };
  if (!u || !u.reset_code || !u.live || u.reset_attempts >= CODE_ATTEMPTS) return bad;
  if (!sameCode(u.reset_code, code)) {
    db.prepare("UPDATE users SET reset_attempts = reset_attempts + 1 WHERE id = ?").run(u.id);
    return bad;
  }
  db.prepare("UPDATE users SET password_hash = ?, reset_code = NULL, reset_expires_at = NULL, reset_attempts = 0 WHERE id = ?").run(await hashPassword(password), u.id);
  destroyAllSessions(u.id);
  clear(`login:${email}`);
  await createSession(u.id);
  redirect(u.verified ? "/me?password=1" : "/verify");
}

/** While developing or demoing without a mail service, the verify page shows the code. Never on the real site. */
export async function devVerifyCode(): Promise<string | null> {
  if (!SHOW_CODES_ON_SCREEN) return null;
  const u = await getCurrentUser();
  if (!u) return null;
  const row = getDb().prepare("SELECT verify_code FROM users WHERE id = ?").get(u.id) as { verify_code: string | null };
  return row.verify_code;
}
