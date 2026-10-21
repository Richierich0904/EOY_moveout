"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { checkPassword, createSession, destroySession, emailAllowed, getCurrentUser, hashPassword, makeVerifyCode } from "@/lib/auth";
import { ALLOWED_EMAIL_DOMAINS, HOUSES } from "@/lib/config";

export type FormState = { error?: string } | undefined;

function str(fd: FormData, k: string) { return String(fd.get(k) ?? "").trim(); }

export async function signup(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const house = str(fd, "house");
  const gradYear = parseInt(str(fd, "grad_year"), 10);
  const password = String(fd.get("password") ?? "");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email." };
  if (!emailAllowed(email)) return { error: `Use your school email (${ALLOWED_EMAIL_DOMAINS.map((d) => "@" + d).join(" or ")}).` };
  if (name.length < 2) return { error: "Enter your name." };
  if (!HOUSES.includes(house)) return { error: "Pick your house." };
  const y = new Date().getFullYear();
  if (!(gradYear >= y - 1 && gradYear <= y + 8)) return { error: "Enter a realistic graduation year." };
  if (password.length < 8) return { error: "Password needs at least 8 characters." };

  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return { error: "That email already has an account. Try logging in." };

  const code = makeVerifyCode();
  const r = db.prepare("INSERT INTO users (email, name, house, grad_year, password_hash, verify_code) VALUES (?, ?, ?, ?, ?, ?)")
    .run(email, name, house, gradYear, await hashPassword(password), code);
  await sendVerifyEmail(email, code);
  await createSession(Number(r.lastInsertRowid));
  redirect("/verify");
}

export async function verify(_prev: FormState, fd: FormData): Promise<FormState> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const code = str(fd, "code");
  const row = getDb().prepare("SELECT verify_code FROM users WHERE id = ?").get(u.id) as { verify_code: string | null };
  if (!row.verify_code || row.verify_code !== code) return { error: "That code doesn't match." };
  getDb().prepare("UPDATE users SET verified = 1, verify_code = NULL WHERE id = ?").run(u.id);
  redirect("/");
}

export async function resendCode(): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.verified) return;
  const code = makeVerifyCode();
  getDb().prepare("UPDATE users SET verify_code = ? WHERE id = ?").run(code, u.id);
  await sendVerifyEmail(u.email, code);
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const row = getDb().prepare("SELECT id, password_hash, verified FROM users WHERE email = ?").get(email) as
    { id: number; password_hash: string; verified: number } | undefined;
  if (!row || !(await checkPassword(password, row.password_hash))) return { error: "Wrong email or password." };
  await createSession(row.id);
  redirect(row.verified ? "/" : "/verify");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/** In development the code is printed to the server console and shown on the verify page.
 *  To send real email, set SMTP_URL and implement delivery here (e.g. with nodemailer). */
async function sendVerifyEmail(email: string, code: string) {
  console.log(`[verify] code for ${email}: ${code}`);
}

export async function devVerifyCode(): Promise<string | null> {
  if (process.env.SMTP_URL) return null;
  const u = await getCurrentUser();
  if (!u) return null;
  const row = getDb().prepare("SELECT verify_code FROM users WHERE id = ?").get(u.id) as { verify_code: string | null };
  return row.verify_code;
}
