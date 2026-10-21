import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { ADMIN_EMAILS, ALLOWED_EMAIL_DOMAINS, SESSION_DAYS } from "./config";

export type User = {
  id: number;
  email: string;
  name: string;
  house: string;
  grad_year: number;
  verified: number;
  created_at: string;
  is_admin: boolean;
};

const COOKIE = "swap_session";

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

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expires.toISOString());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.house, u.grad_year, u.verified, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .get(token) as Omit<User, "is_admin"> | undefined;
  return row ? { ...row, is_admin: ADMIN_EMAILS.includes(row.email.toLowerCase()) } : null;
}

/** Returns the signed-in, verified user or throws. Use inside server actions. */
export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("You need to be signed in.");
  if (!u.verified) throw new Error("Please verify your email first.");
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (!u.is_admin) throw new Error("Admins only.");
  return u;
}
