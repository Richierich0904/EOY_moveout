import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { ADMIN_EMAILS, ALLOWED_EMAIL_DOMAINS, SESSION_DAYS } from "./config";
import { sqlTime } from "./time";

export type User = {
  id: number;
  email: string;
  name: string;
  house: string;
  grad_year: number;
  verified: number;
  created_at: string;
  avatar: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  rules_accepted_at: string | null;
  hide_from_rankings: number;
  is_admin: boolean;
};

export const SESSION_COOKIE = "swap_session";

export function emailAllowed(email: string) {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function checkPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function makeVerifyCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Compare two codes without leaking how many characters matched. */
export function sameCode(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Only ever send people back to a page on this site. */
export function safeNext(next: unknown): string {
  const s = typeof next === "string" ? next : "";
  return /^\/(?![/\\])[^\s]*$/.test(s) ? s : "/";
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, sqlTime(expires));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(SESSION_COOKIE);
}

/** Sign a student out everywhere, for example after a password change. */
export function destroyAllSessions(userId: number) {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

/** Whoever is signed in, verified or not. Looked up once per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.house, u.grad_year, u.verified, u.created_at, u.avatar,
              u.suspended_at, u.suspended_reason, u.rules_accepted_at, u.hide_from_rankings
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .get(token) as Omit<User, "is_admin"> | undefined;
  return row ? { ...row, is_admin: ADMIN_EMAILS.includes(row.email.toLowerCase()) } : null;
});

/** True for a signed-in student who may use the site: verified and not suspended. */
export function isMember(u: User | null): u is User {
  return !!u && !!u.verified && !u.suspended_at;
}

/** Returns the signed-in, verified user or throws. Use inside server actions. */
export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("You need to be signed in.");
  if (!u.verified) throw new Error("Please verify your email first.");
  if (u.suspended_at) throw new Error("Your account is paused. See the Help page for who to talk to.");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (!u.is_admin) throw new Error("Organisers only.");
  return u;
}

/** Use at the top of every page that shows anything about students.
 *  Sends visitors to log in, finish verifying, read why they're paused, or accept the rules. */
export async function requireViewer(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) {
    const path = (await headers()).get("x-path") ?? "/";
    redirect(path === "/" ? "/login" : `/login?next=${encodeURIComponent(path)}`);
  }
  if (!u.verified) redirect("/verify");
  if (u.suspended_at) redirect("/suspended");
  if (!u.rules_accepted_at) redirect("/rules?accept=1");
  return u;
}

/** Organiser pages. Everyone else gets the not-found page, so the pages don't advertise themselves. */
export async function requireAdminViewer(): Promise<User> {
  const u = await requireViewer();
  if (!u.is_admin) notFound();
  return u;
}
