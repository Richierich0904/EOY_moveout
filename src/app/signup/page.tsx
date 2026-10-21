import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/AuthForms";
import { ALLOWED_EMAIL_DOMAINS, HOUSES } from "@/lib/config";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return <div className="mx-auto max-w-sm rounded-2xl border border-line bg-card p-6"><h1 className="mb-4 text-2xl font-bold">Join</h1><SignupForm houses={HOUSES} domains={ALLOWED_EMAIL_DOMAINS} /></div>;
}
