import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { HOUSES } from "@/lib/config";
import { classLabel } from "@/lib/format";
import { PageIntro } from "@/components/PageIntro";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "@/components/SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireViewer();
  return (
    <div className="grid max-w-xl gap-10">
      <PageIntro eyebrow="My account" title="Settings" sub={`Signed in as ${user.email}. Your email can't be changed, because it's what proves you're a student here.`}>
        <Link href="/me" className="btn-ghost">Back to my account</Link>
      </PageIntro>
      <section className="card grid gap-4 p-5 sm:p-7"><h2>About you</h2><ProfileForm user={user} houses={HOUSES.includes(user.house) ? HOUSES : [user.house, ...HOUSES]} classLabel={classLabel(user.grad_year)} /></section>
      <section className="card grid gap-4 p-5 sm:p-7"><h2>Password</h2><PasswordForm /></section>
      <section className="card grid gap-4 p-5 sm:p-7"><h2>Delete account</h2><DeleteAccountForm /></section>
    </div>
  );
}
