import { requireViewer } from "@/lib/auth";
import { SellForms } from "@/components/SellForms";
import { CATEGORIES, HANDOFF_SPOTS, MAX_PHOTOS } from "@/lib/config";
import { priceSuggestion } from "@/lib/listings";

export const metadata = { title: "Sell something" };

export default async function NewListing({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  await requireViewer();
  const { mode } = await searchParams;
  const suggestions = Object.fromEntries(CATEGORIES.map((c) => [c.slug, priceSuggestion(c.slug)]));
  return <SellForms bulk={mode === "bulk"} suggestions={suggestions} spots={HANDOFF_SPOTS} maxPhotos={MAX_PHOTOS} />;
}
