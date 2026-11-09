import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WantForm } from "@/components/WantForm";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Post a wanted ad" };

export default async function NewWant() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wanted/new");
  if (!user.verified) redirect("/verify");
  return (
    <div className="grid max-w-xl gap-10">
      <PageIntro eyebrow="Wanted ad" title="What are you looking for?" sub="Anyone who lists something that matches gets a nudge to message you." />
      <div className="card p-5 sm:p-7"><WantForm /></div>
    </div>
  );
}
