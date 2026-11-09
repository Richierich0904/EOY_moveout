import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="grid max-w-md gap-8">
      <PageIntro eyebrow="Welcome back" title="Log in" />
      <div className="card p-6 sm:p-8"><LoginForm /></div>
    </div>
  );
}
