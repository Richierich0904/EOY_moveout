import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/AuthForms";
import { ALLOWED_EMAIL_DOMAINS, APP_NAME, HOUSES, SCHOOL_NAME, SIGNUP_OPEN, STAFF_NOTICE } from "@/lib/config";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Join" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  if (!SIGNUP_OPEN) {
    return (
      <div className="grid max-w-md gap-8">
        <PageIntro eyebrow={`${SCHOOL_NAME} students only`} title="Sign-up is not open yet" sub={`${APP_NAME} is still being set up for ${SCHOOL_NAME}. Ask the organisers when it opens.`} />
        <div className="flex flex-wrap gap-2"><Link href="/login" className="btn-ghost">Log in</Link><Link href="/rules" className="btn-ghost">Read the rules</Link></div>
      </div>
    );
  }
  return (
    <div className="grid max-w-md gap-8">
      <PageIntro eyebrow={`${SCHOOL_NAME} students only`} title={`Join ${APP_NAME}`} sub="Your real name and dorm show on your listings, to other students only. That's what keeps it friendly." />
      <div className="card p-6 sm:p-8"><SignupForm houses={HOUSES} domains={ALLOWED_EMAIL_DOMAINS} staffNotice={STAFF_NOTICE} /></div>
    </div>
  );
}
