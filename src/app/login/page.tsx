import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  return (
    <div className="grid max-w-md gap-8">
      <PageIntro eyebrow="Welcome back" title="Log in" sub={next ? "Log in to carry on where you were." : undefined} />
      <div className="card p-6 sm:p-8"><LoginForm next={next ? safeNext(next) : undefined} /></div>
    </div>
  );
}
