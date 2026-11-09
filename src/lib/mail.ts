// Outgoing email. Set SMTP_URL (and MAIL_FROM) to send for real.
// Without it, messages are printed to the server console while developing or demoing,
// and simply not sent on a production site (where sign-up stays closed until mail is set up).

import nodemailer, { type Transporter } from "nodemailer";
import { APP_NAME, MAIL_FROM, SHOW_CODES_ON_SCREEN, SMTP_URL } from "./config";

let transport: Transporter | null = null;

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (!SMTP_URL) {
    if (SHOW_CODES_ON_SCREEN) console.log(`[mail] to ${to} · ${subject}\n${text}`);
    return SHOW_CODES_ON_SCREEN;
  }
  transport ??= nodemailer.createTransport(SMTP_URL);
  try {
    await transport.sendMail({ from: MAIL_FROM || `${APP_NAME} <no-reply@localhost>`, to, subject, text });
    return true;
  } catch (e) {
    console.error(`[mail] could not send to ${to}: ${(e as Error).message}`);
    return false;
  }
}

export function sendCode(to: string, code: string, purpose: "verify" | "reset", minutes: number) {
  const subject = purpose === "verify" ? `${code} is your ${APP_NAME} code` : `${code} resets your ${APP_NAME} password`;
  const text = purpose === "verify"
    ? `Your ${APP_NAME} code is ${code}.\n\nEnter it on the site to finish joining. It works for ${minutes} minutes.\n\nIf you didn't try to join ${APP_NAME}, ignore this email.`
    : `Your ${APP_NAME} password reset code is ${code}.\n\nIt works for ${minutes} minutes.\n\nIf you didn't ask to reset your password, ignore this email. Your password has not changed.`;
  return sendMail(to, subject, text);
}
