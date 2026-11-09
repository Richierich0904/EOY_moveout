import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { acceptRules } from "@/actions/moderation";
import { APP_NAME, HANDOFF_SPOTS, SCHOOL_NAME, STAFF_NOTICE } from "@/lib/config";
import { BE_KIND, NOT_ALLOWED } from "@/lib/rules";
import { judgeOn } from "@/lib/judge";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Rules" };

export default async function RulesPage({ searchParams }: { searchParams: Promise<{ accept?: string }> }) {
  const { accept } = await searchParams;
  const user = await getCurrentUser();
  const ai = judgeOn();
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
        <p className="text-[13px] text-muted">{ai ? "Every listing, wanted post and photo is checked automatically before it goes live." : "Every listing and wanted post is checked automatically before it goes live."} Anything that might break these rules is held, and an organiser looks at it before anyone else sees it. Not sure about something? Ask an organiser first.</p>
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
          {ai && <p>Listings, wanted posts and photos are also checked by an automated AI system before they go live. It only flags things for an organiser. A person always makes the decision. Your messages are not sent to it.</p>}
          <p>Every listing, wanted post, chat and profile has a <b className="font-semibold">Report</b> button. Reports go to the organisers, and the other person isn&apos;t told who sent it.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2"><Link href="/help" className="btn-ghost">Help &amp; safety</Link><Link href="/privacy" className="btn-ghost">Privacy</Link></div>
    </div>
  );
}
