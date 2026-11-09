import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { acceptRules } from "@/actions/moderation";
import { APP_NAME, HANDOFF_SPOTS, SCHOOL_NAME, STAFF_NOTICE } from "@/lib/config";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Rules" };

const NOT_ALLOWED = [
  "Vapes, e-cigarettes, tobacco or nicotine of any kind",
  "Alcohol, drugs, or anything used to take them",
  "Medicine of any kind, including prescription medicine, painkillers and supplements",
  "Weapons, knives, fireworks, lighters, or anything made to hurt someone",
  "Fake IDs, test answers, homework, essays or anything that breaks the honour code",
  "Anything that isn't yours, or that belongs to the school",
  "Food or drink that has been opened, and anything past its date",
  "Services, favours, dares, or anything that isn't an actual item",
  "Anything else the school's rules don't allow you to have",
];

const BE_KIND = [
  "Use your real name and keep your profile photo school-appropriate.",
  "Photos show the item only. No people in listing photos.",
  "Describe things honestly, including what's broken or missing.",
  "Be kind in messages. No pressure, teasing, or asking for personal details.",
  "Don't pass things back and forth just to collect points. Handoffs between the same two people stop counting.",
  "If someone says no, or stops replying, leave it there.",
];

export default async function RulesPage({ searchParams }: { searchParams: Promise<{ accept?: string }> }) {
  const { accept } = await searchParams;
  const user = await getCurrentUser();
  const mustAccept = !!user && !!user.verified && !user.rules_accepted_at;
  return (
    <div className="grid max-w-2xl gap-10">
      <PageIntro eyebrow={`${APP_NAME} at ${SCHOOL_NAME}`} title="The rules" sub="Short, and they matter. Breaking them can get a post removed or an account paused." />

      {(mustAccept || accept) && mustAccept && (
        <form action={acceptRules} className="card grid gap-3 border-fg p-5">
          <p className="text-[14.5px]"><b className="font-semibold">One quick thing before you carry on.</b> We&apos;ve added rules to keep {APP_NAME} safe. Please read them and agree.</p>
          <button className="btn-primary justify-self-start">I&apos;ve read the rules and I agree</button>
        </form>
      )}

      <section className="grid gap-3">
        <h2>What you can&apos;t list or ask for</h2>
        <ul className="card divide-y divide-line">
          {NOT_ALLOWED.map((x) => <li key={x} className="flex gap-3 px-5 py-3 text-[14.5px]"><span aria-hidden className="font-bold">×</span>{x}</li>)}
        </ul>
        <p className="text-[13px] text-muted">Posts that mention these things are held and checked by an organiser before anyone else sees them. Not sure about something? Ask an organiser first.</p>
      </section>

      <section className="grid gap-3">
        <h2>How to treat each other</h2>
        <ul className="card divide-y divide-line">
          {BE_KIND.map((x) => <li key={x} className="flex gap-3 px-5 py-3 text-[14.5px]"><span aria-hidden className="font-bold text-accent">✓</span>{x}</li>)}
        </ul>
      </section>

      <section className="grid gap-3">
        <h2>Meeting up</h2>
        <div className="card grid gap-3 p-5 text-[14.5px]">
          <p>Hand things over at one of the school&apos;s public meeting spots, in the daytime, with other people around:</p>
          <ul className="flex flex-wrap gap-2">{HANDOFF_SPOTS.map((s) => <li key={s} className="border border-line px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[.06em]">{s}</li>)}</ul>
          <p>Never in a dorm room, and never off campus. Pay in person, and only after you&apos;ve looked at the item.</p>
        </div>
      </section>

      <section className="grid gap-3">
        <h2>Who is watching</h2>
        <div className="card grid gap-2 p-5 text-[14.5px]">
          <p>{STAFF_NOTICE} They do this to keep everyone safe, and every time they open a conversation it is recorded.</p>
          <p>Every listing, wanted post, chat and profile has a <b className="font-semibold">Report</b> button. Reports go to the organisers, and the other person isn&apos;t told who sent it.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2"><Link href="/help" className="btn-ghost">Help &amp; safety</Link><Link href="/privacy" className="btn-ghost">Privacy</Link></div>
    </div>
  );
}
