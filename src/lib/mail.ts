// Outgoing email: sign-up codes and password-reset codes.
//
// Set up a mail server with either
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS   (plain settings, easiest)
// or
//   SMTP_URL                                      (one line, e.g. smtps://user:pass@host:465)
// and optionally MAIL_FROM. Without a mail server, messages are printed to the server console
// while developing or demoing, and not sent at all on a production site (where sign-up stays
// closed until mail is set up).

import nodemailer, { type Transporter } from "nodemailer";
import { APP_NAME, MAIL_FROM, MAIL_ON, SHOW_CODES_ON_SCREEN, SMTP_HOST, SMTP_PORT, SMTP_URL, SMTP_USER } from "./config";

let transport: Transporter | null = null;

/** Google shows app passwords in four groups with spaces between them. The spaces aren't part of the password. */
export function tidyPassword(host: string, pass: string) {
  return /(^|\.)g(oogle)?mail\.com$/i.test(host) ? pass.replace(/\s+/g, "") : pass;
}

function mailer(): Transporter {
  if (transport) return transport;
  if (SMTP_HOST) {
    const pass = tidyPassword(SMTP_HOST, process.env.SMTP_PASS ?? "");
    transport = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 is encrypted from the start; 587 and others upgrade after connecting
      auth: SMTP_USER ? { user: SMTP_USER, pass } : undefined,
      // Don't leave a student's sign-up hanging if the mail server is unreachable.
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
    });
  } else {
    transport = nodemailer.createTransport(SMTP_URL);
  }
  return transport;
}

/** The address mail is sent from. Gmail and most services only accept the account's own address. */
function fromAddress() {
  if (MAIL_FROM) return MAIL_FROM;
  if (SMTP_USER.includes("@")) return `${APP_NAME} <${SMTP_USER}>`;
  return `${APP_NAME} <no-reply@localhost>`;
}

/** What is set up, without the password. For the organiser page and the test command. */
export function mailSummary() {
  let server = SMTP_HOST ? `${SMTP_HOST}:${SMTP_PORT}` : "";
  let account = SMTP_USER;
  if (!SMTP_HOST && SMTP_URL) {
    try { const u = new URL(SMTP_URL); server = `${u.hostname}${u.port ? ":" + u.port : ""}`; account = decodeURIComponent(u.username); } catch { server = "set by SMTP_URL"; }
  }
  return { on: MAIL_ON, server, account, from: MAIL_ON ? fromAddress() : "" };
}

/** Turn a mail error into a sentence that says what to fix. */
function explain(e: unknown): string {
  const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
  const text = `${err.response ?? ""} ${err.message ?? ""}`;
  const where = mailSummary().server || "the mail server";
  if (/application-specific password|5\.7\.9/i.test(text)) return "Gmail wants an app password here, not your normal password. Create one in your Google account's security settings (2-Step Verification must be on) and put its 16 letters in SMTP_PASS.";
  if (err.code === "EAUTH" || err.responseCode === 535 || /username and password not accepted|invalid (login|username)|authentication (failed|unsuccessful)/i.test(text))
    return "The mail server refused the username or password. Check SMTP_USER is the full address and SMTP_PASS is right. For Gmail, SMTP_PASS must be a 16-letter app password, not your normal password.";
  if (err.code === "EDNS" || /ENOTFOUND|getaddrinfo/i.test(text)) return `The mail server "${SMTP_HOST || where}" could not be found. Check the spelling of SMTP_HOST.`;
  if (/wrong version number|ssl routines|tls/i.test(text) && !/starttls/i.test(text)) return "The port and the security setting don't match. Use SMTP_PORT=465, or try 587.";
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED", "ECONNRESET"].includes(err.code ?? "") || /ECONNREFUSED|timed? ?out|greeting never received/i.test(text))
    return `Could not reach the mail server at ${where}. Check SMTP_HOST and SMTP_PORT, and that this network allows outgoing mail (some school and public networks block it).`;
  if (err.code === "EENVELOPE" || (err.responseCode ?? 0) >= 550) return `The mail server refused this message: ${(err.response ?? err.message ?? "").slice(0, 200)}. Check the address you are sending to, and that MAIL_FROM is an address this account is allowed to send from.`;
  return (err.message ?? "Unknown mail error").slice(0, 300);
}

export type MailResult = { ok: true } | { ok: false; reason: string };

/** Sign in to the mail server without sending anything, to check the settings. */
export async function checkMail(): Promise<MailResult> {
  if (!MAIL_ON) return { ok: false, reason: "No mail server is set up. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to .env.local." };
  try { await mailer().verify(); return { ok: true }; } catch (e) { return { ok: false, reason: explain(e) }; }
}

/** Send one message and say plainly why it failed, if it did. */
export async function sendMailDetailed(to: string, subject: string, text: string): Promise<MailResult> {
  if (!MAIL_ON) {
    if (SHOW_CODES_ON_SCREEN) { console.log(`[mail] to ${to} · ${subject}\n${text}`); return { ok: true }; }
    return { ok: false, reason: "No mail server is set up." };
  }
  try {
    await mailer().sendMail({ from: fromAddress(), to, subject, text });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: explain(e) };
  }
}

/** Send a message from the site. Failures are logged and counted, so organisers can see them. */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const r = await sendMailDetailed(to, subject, text);
  if (!r.ok) {
    console.error(`[mail] could not send to ${to}: ${r.reason}`);
    try { const { record } = await import("./limits"); record("mail:fail"); } catch { /* the count is a nicety, never a reason to fail */ }
  }
  return r.ok;
}

export function codeMessage(code: string, purpose: "verify" | "reset", minutes: number) {
  const subject = purpose === "verify" ? `${code} is your ${APP_NAME} code` : `${code} resets your ${APP_NAME} password`;
  const text = purpose === "verify"
    ? `Your ${APP_NAME} code is ${code}.\n\nEnter it on the site to finish joining. It works for ${minutes} minutes.\n\nIf you didn't try to join ${APP_NAME}, ignore this email. Nobody can use your address without this code.`
    : `Your ${APP_NAME} password reset code is ${code}.\n\nIt works for ${minutes} minutes.\n\nIf you didn't ask to reset your password, ignore this email. Your password has not changed.`;
  return { subject, text };
}

export function sendCode(to: string, code: string, purpose: "verify" | "reset", minutes: number) {
  const { subject, text } = codeMessage(code, purpose, minutes);
  return sendMail(to, subject, text);
}
