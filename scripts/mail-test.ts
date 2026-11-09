// Send one test email, to check the mail settings in .env.local.
//
//   npm run mail:test you@example.com
//
// It signs in to the mail server, sends a sample sign-up email, and says in plain words
// what went wrong if anything did. Your password is never printed.
import "./load-env";
import { CODE_MINUTES } from "../src/lib/config";
import { checkMail, codeMessage, mailSummary, sendMailDetailed } from "../src/lib/mail";

async function main() {
  const to = process.argv[2];
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    console.error("Say where to send the test, for example:\n  npm run mail:test you@example.com");
    process.exit(1);
  }
  const m = mailSummary();
  if (!m.on) {
    console.error("No mail server is set up yet.\nCreate a file called .env.local in this folder with these four lines, then run this again:\n\n  SMTP_HOST=smtp.gmail.com\n  SMTP_PORT=465\n  SMTP_USER=your-address@gmail.com\n  SMTP_PASS=your16letterapppassword\n");
    process.exit(1);
  }
  console.log(`Mail server: ${m.server}`);
  console.log(`Account:     ${m.account || "(none)"}`);
  console.log(`Sent from:   ${m.from}`);
  console.log(`Password:    ${process.env.SMTP_PASS || /:[^@/]+@/.test(process.env.SMTP_URL ?? "") ? "set (hidden)" : "NOT SET"}\n`);

  process.stdout.write("1. Signing in to the mail server... ");
  const check = await checkMail();
  if (!check.ok) { console.log("failed.\n\n" + check.reason); process.exit(1); }
  console.log("ok.");

  process.stdout.write(`2. Sending a test email to ${to}... `);
  const { subject, text } = codeMessage("123456", "verify", CODE_MINUTES);
  const sent = await sendMailDetailed(to, `[Test] ${subject}`, `This is a test from the mail:test command. The code below is a sample and does nothing.\n\n${text}`);
  if (!sent.ok) { console.log("failed.\n\n" + sent.reason); process.exit(1); }
  console.log("sent.\n");
  console.log("Check that inbox, and its spam or junk folder. School mail filters can take a few minutes,");
  console.log("and may hold mail from a new sender. If it never arrives, ask school IT whether it was blocked.");
}

main();
