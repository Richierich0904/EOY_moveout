import Link from "next/link";
import { Icon } from "./Icons";
import { APP_NAME, SCHOOL_NAME } from "@/lib/config";

const STEPS: [string, string][] = [
  ["List it", "Snap a photo of the lamp, the rug or last year's textbook. Put a price on it, or give it away."],
  ["Meet on campus", "Agree a time in messages and hand it over at one of the school's public meeting spots."],
  ["Keep it out of the skip", "Every handoff earns points for you and your dorm. Nothing ships and nothing is thrown out."],
];

/** What a visitor sees before logging in. It never shows a student's name, photo or listing. */
export function Landing({ pending, note }: { pending: boolean; note?: string }) {
  return (
    <div className="grid grid-cols-1 gap-16 sm:gap-24">
      <section className="rise grid max-w-3xl gap-6">
        {note && <p className="bg-bg-deep p-3.5 text-[14px]">{note}</p>}
        <p className="text-[13px] uppercase tracking-[.08em] text-muted">{SCHOOL_NAME} · students only</p>
        <h1 className="text-[clamp(2.8rem,8vw,5.6rem)]">Don&apos;t bin it.<br />Swap it.</h1>
        <p className="sub max-w-[34em]">{APP_NAME} is where students at {SCHOOL_NAME} buy, sell and give away the things they no longer need. Everything stays on campus, and only students with a school email can see it.</p>
        <div className="flex flex-wrap items-center gap-3">
          {pending ? (
            <Link href="/verify" className="btn-primary h-12">Finish verifying your email</Link>
          ) : (
            <>
              <Link href="/signup" className="btn-primary h-12">Join with school email</Link>
              <Link href="/login" className="btn-ghost h-12 min-w-[160px] justify-between">Log in <Icon name="arrow" size={18} stroke={1.6} /></Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6">
        <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] leading-[.9]">How it works</h2>
        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          {STEPS.map(([t, body], i) => (
            <li key={t} className="card reveal grid content-start gap-3 p-5" style={{ ["--i" as string]: i }}>
              <span className="display text-[34px] leading-none text-accent">{i + 1}</span>
              <h3>{t}</h3>
              <p className="text-[14px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="reveal grid gap-4 border-t border-fg pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid max-w-2xl gap-2">
          <h2 className="text-[clamp(1.4rem,3vw,2rem)]">Built for a school</h2>
          <p className="sub">No strangers, no shipping and no payments on the site. There are rules about what can be listed, a report button on everything, and organisers who look after it.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link href="/rules" className="btn-ghost">Rules</Link><Link href="/help" className="btn-ghost">Help &amp; safety</Link><Link href="/privacy" className="btn-ghost">Privacy</Link></div>
      </section>
    </div>
  );
}
