import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { VerifyForm } from "@/components/AuthForms";
import { devVerifyCode, resendCode } from "@/actions/auth";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Verify your email" };

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.verified) redirect("/");
  const devCode = await devVerifyCode();
  return (
    <div className="grid max-w-md gap-8">
      <PageIntro eyebrow="One last step" title="Check your email" sub={<>We sent a code to <b className="font-semibold text-fg">{user.email}</b>. Enter it to prove you&apos;re a student.</>} />
      <div className="card grid gap-4 p-6 sm:p-8">
        <VerifyForm devCode={devCode} />
        <form action={resendCode} className="text-center"><button className="more mx-auto text-[14.5px]">Send a new code</button></form>
      </div>
    </div>
  );
}
