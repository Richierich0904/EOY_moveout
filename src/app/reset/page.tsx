import { ResetForm, ResetRequestForm } from "@/components/AuthForms";
import { CODE_MINUTES } from "@/lib/config";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Reset your password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="grid max-w-md gap-8">
      {email ? (
        <>
          <PageIntro eyebrow="Reset your password" title="Check your email" sub={<>If <b className="font-semibold text-fg">{email}</b> has an account, we just sent it a code. It works for {CODE_MINUTES} minutes.</>} />
          <div className="card p-6 sm:p-8"><ResetForm email={email} /></div>
        </>
      ) : (
        <>
          <PageIntro eyebrow="Reset your password" title="Forgot it?" sub="Enter your school email and we'll send a code to set a new password." />
          <div className="card p-6 sm:p-8"><ResetRequestForm /></div>
        </>
      )}
    </div>
  );
}
