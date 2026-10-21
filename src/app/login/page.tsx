import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <div className="mx-auto max-w-sm rounded-2xl border border-line bg-card p-6"><h1 className="mb-4 text-2xl font-bold">Log in</h1><LoginForm /></div>;
}
