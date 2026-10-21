import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SellForms } from "@/components/SellForms";
import { CATEGORIES } from "@/lib/config";
import { priceSuggestion } from "@/lib/listings";

export default async function NewListing({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/listings/new");
  if (!user.verified) redirect("/verify");
  const { mode } = await searchParams;
  const suggestions = Object.fromEntries(CATEGORIES.map((c) => [c.slug, priceSuggestion(c.slug)]));
  return <SellForms bulk={mode === "bulk"} suggestions={suggestions} />;
}
