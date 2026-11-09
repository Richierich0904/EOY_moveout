import Link from "next/link";
import { APP_NAME, SAFETY_CONTACT_EMAIL, SAFETY_CONTACT_NAME, SCHOOL_NAME, STAFF_NOTICE } from "@/lib/config";
import { judgeOn } from "@/lib/judge";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Privacy" };

const rows = (): [string, string][] => [
  ["What we keep", "Your school email, name, dorm and graduation year. Your password, stored scrambled so nobody can read it. Your listings, wanted posts, messages, photos, points and credits."],
  ["Who can see your profile", `Only students at ${SCHOOL_NAME} who are logged in, and the organisers. Nobody outside school can see names, photos or listings, and the site is hidden from search engines.`],
  ["Who can see your email", "Only you and the organisers. Other students never see it."],
  ["Messages", `${STAFF_NOTICE} Other students can only see the conversations they are part of.`],
  ["Safety checks", judgeOn()
    ? "Before a listing, a wanted post or a photo goes live, it is checked by an automated AI system (Claude, made by Anthropic) against the school's rules. Only the post's words and photos are sent. Your name, email and dorm are not, and neither are your messages. The AI only flags things. An organiser always makes the decision."
    : "Listings and wanted posts are checked against a list of words for things that aren't allowed. Anything that matches is held for an organiser, who makes the decision."],
  ["Photos", "When you upload a photo we save a fresh copy without the hidden details phones add, such as where it was taken. Only logged-in students can open photos."],
  ["Rankings", "Your name appears on the rankings when you earn points. You can hide yourself from them in your settings at any time."],
  ["Money", "The site never handles money or card details. You pay each other in person."],
  ["Tracking", "No adverts, and no tracking by other companies. One cookie keeps you logged in."],
  ["Deleting your account", "Delete it yourself in settings. Your listings, wanted posts, messages and photos go with it."],
];

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <div className="grid max-w-2xl gap-10">
      <PageIntro eyebrow={APP_NAME} title="Privacy" sub="In plain words: what we keep about you, who can see it, and how to remove it." />
      <dl className="card divide-y divide-line">
        {rows().map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="font-semibold">{k}</dt><dd className="text-[14.5px] text-muted">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[14px] text-muted">Questions about your information? {SAFETY_CONTACT_NAME || SAFETY_CONTACT_EMAIL ? <>Ask {SAFETY_CONTACT_NAME || "the school"}{SAFETY_CONTACT_EMAIL && <> at <a href={`mailto:${SAFETY_CONTACT_EMAIL}`} className="a-link">{SAFETY_CONTACT_EMAIL}</a></>}.</> : "Ask your dorm parent or the organisers."}</p>
      <div className="flex flex-wrap gap-2"><Link href="/rules" className="btn-ghost">Rules</Link><Link href="/help" className="btn-ghost">Help &amp; safety</Link></div>
    </div>
  );
}
