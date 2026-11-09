import { requireViewer } from "@/lib/auth";
import { WantForm } from "@/components/WantForm";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Post a wanted ad" };

export default async function NewWant() {
  await requireViewer();
  return (
    <div className="grid max-w-xl gap-10">
      <PageIntro eyebrow="Wanted ad" title="What are you looking for?" sub="You'll get an alert the moment someone lists a match." />
      <div className="card p-5 sm:p-7"><WantForm /></div>
    </div>
  );
}
