import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/AuthForms";
import { ALLOWED_EMAIL_DOMAINS, APP_NAME, HOUSES, SCHOOL_NAME } from "@/lib/config";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Join" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="grid max-w-md gap-8">
      <PageIntro eyebrow={`${SCHOOL_NAME} students only`} title={`Join ${APP_NAME}`} sub="Your real name and house show on your listings. That's what keeps it friendly." />
      <div className="card p-6 sm:p-8"><SignupForm houses={HOUSES} domains={ALLOWED_EMAIL_DOMAINS} /></div>
    </div>
  );
}
