import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { SAFETY_CONTACT_EMAIL, SAFETY_CONTACT_NAME } from "@/lib/config";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Account paused" };

export default async function SuspendedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.suspended_at) redirect("/");
  return (
    <div className="grid max-w-xl gap-8">
      <PageIntro eyebrow="Your account" title="Your account is paused" sub="An organiser has paused your account, so you can't post, message or see listings for now." />
      <div className="card grid gap-3 p-5 text-[14.5px]">
        {user.suspended_reason && <p><b className="font-semibold">Reason:</b> {user.suspended_reason}</p>}
        <p>To sort this out, talk to {SAFETY_CONTACT_NAME || "your dorm parent or an organiser"}{SAFETY_CONTACT_EMAIL && <> (<a href={`mailto:${SAFETY_CONTACT_EMAIL}`} className="a-link">{SAFETY_CONTACT_EMAIL}</a>)</>}. If you think it&apos;s a mistake, say so. They can un-pause it.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/rules" className="btn-ghost">Read the rules</Link>
        <form action={logout}><button className="btn-ghost">Sign out</button></form>
      </div>
    </div>
  );
}
