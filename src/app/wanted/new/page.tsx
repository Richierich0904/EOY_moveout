import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WantForm } from "@/components/WantForm";

export default async function NewWant() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wanted/new");
  if (!user.verified) redirect("/verify");
  return <div className="mx-auto max-w-xl"><h1 className="mb-4 text-2xl font-bold">What are you looking for?</h1><WantForm /></div>;
}
