import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { VerifyForm } from "@/components/AuthForms";
import { devVerifyCode, resendCode } from "@/actions/auth";

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.verified) redirect("/");
  const devCode = await devVerifyCode();
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-line bg-card p-6">
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="mb-4 mt-1 text-sm text-muted">We sent a code to <b>{user.email}</b>. Enter it to prove you&apos;re a student.</p>
      <VerifyForm devCode={devCode} />
      <form action={resendCode} className="mt-3 text-center"><button className="text-sm text-muted underline">Send a new code</button></form>
    </div>
  );
}
