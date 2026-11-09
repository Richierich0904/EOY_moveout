import Link from "next/link";
import { APP_NAME, HANDOFF_SPOTS, SAFETY_CONTACT_EMAIL, SAFETY_CONTACT_NAME, STAFF_NOTICE } from "@/lib/config";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Help & safety" };

const TIPS: [string, string][] = [
  ["Meet in public", `Use one of the school's meeting spots (${HANDOFF_SPOTS.join(", ")}). Never a dorm room, never off campus.`],
  ["Bring a friend if you like", "It's always fine to bring someone along, or to say no and walk away."],
  ["Look before you pay", "Check the item works and matches the listing. Pay in person, not in advance."],
  ["Keep personal things personal", "You never need to share a password, a home address, a phone number or a photo of yourself to swap something."],
  ["Trust the uneasy feeling", "If a message or a meeting feels wrong, stop replying, press Report, and tell an adult."],
];

const HOW: [string, string][] = [
  ["Report", "Every listing, wanted post, chat and profile has a Report link. It goes to the organisers. The other person isn't told who reported them."],
  ["Block", "Block someone from their profile or from a chat. They can't message you, and you stop seeing each other's posts. You can unblock from your account page."],
  ["Paused accounts", "Organisers can pause an account that breaks the rules. A paused student can't post or message until an organiser un-pauses them."],
];

export default function HelpPage() {
  const hasContact = !!(SAFETY_CONTACT_NAME || SAFETY_CONTACT_EMAIL);
  return (
    <div className="grid max-w-2xl gap-10">
      <PageIntro eyebrow={APP_NAME} title="Help & safety" sub="Swapping should feel easy and safe. Here's how to keep it that way, and who to go to if it doesn't." />

      <section className="card grid gap-3 border-fg p-5 sm:p-6" data-safety-contact>
        <h2 className="text-[20px]">If something feels wrong</h2>
        <p className="text-[14.5px]">Tell an adult you trust straight away: your dorm parent, your advisor, a teacher or the health centre. You won&apos;t be in trouble for speaking up, even if you think you made a mistake.</p>
        {hasContact
          ? <p className="text-[14.5px]">For anything about {APP_NAME}, contact <b className="font-semibold">{SAFETY_CONTACT_NAME || "the school"}</b>{SAFETY_CONTACT_EMAIL && <> at <a href={`mailto:${SAFETY_CONTACT_EMAIL}`} className="a-link">{SAFETY_CONTACT_EMAIL}</a></>}.</p>
          : <p className="text-[14.5px]">For anything about {APP_NAME}, speak to your dorm parent or the organisers.</p>}
        <p className="text-[13px] text-muted">If you or someone else is in danger right now, find the nearest adult or call campus safety. Don&apos;t wait for a reply on here.</p>
      </section>

      <section className="grid gap-3">
        <h2>Five habits</h2>
        <ol className="card divide-y divide-line">
          {TIPS.map(([t, body], i) => <li key={t} className="grid grid-cols-[2rem_1fr] gap-x-2 px-5 py-4"><span className="display text-[18px] text-accent">{i + 1}</span><span><b className="font-semibold">{t}.</b> <span className="text-muted">{body}</span></span></li>)}
        </ol>
      </section>

      <section className="grid gap-3">
        <h2>Report and block</h2>
        <ul className="card divide-y divide-line">
          {HOW.map(([t, body]) => <li key={t} className="px-5 py-4 text-[14.5px]"><b className="font-semibold">{t}.</b> <span className="text-muted">{body}</span></li>)}
        </ul>
        <p className="text-[13px] text-muted">{STAFF_NOTICE}</p>
      </section>

      <section className="grid gap-3">
        <h2>Common questions</h2>
        <div className="card divide-y divide-line text-[14.5px]">
          <p className="px-5 py-4"><b className="font-semibold">Does money go through the site?</b> <span className="text-muted">No. You pay the other student in person. The site never holds money.</span></p>
          <p className="px-5 py-4"><b className="font-semibold">What are credits?</b> <span className="text-muted">You earn them for confirmed handoffs and prizes, and spend them on boosting a listing to the top of the shelves. They can&apos;t be bought, sent to anyone or turned into money.</span></p>
          <p className="px-5 py-4"><b className="font-semibold">Why didn&apos;t my handoff earn points?</b> <span className="text-muted">It needs a photo on the listing and the other person has to confirm it. Only a couple of handoffs between the same two students count each month.</span></p>
          <p className="px-5 py-4"><b className="font-semibold">Can I come off the rankings?</b> <span className="text-muted">Yes. Turn on “Hide me from the rankings” in your settings.</span></p>
          <p className="px-5 py-4"><b className="font-semibold">Forgot your password?</b> <span className="text-muted"><Link href="/reset" className="a-link">Reset it here</Link> with a code sent to your school email.</span></p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2"><Link href="/rules" className="btn-ghost">Rules</Link><Link href="/privacy" className="btn-ghost">Privacy</Link></div>
    </div>
  );
}
