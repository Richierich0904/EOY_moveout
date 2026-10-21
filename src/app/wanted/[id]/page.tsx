import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWant } from "@/lib/social";
import { searchListings } from "@/lib/listings";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { Who } from "@/components/Avatar";
import { MessageForm } from "@/components/MessageForm";
import { ListingCard } from "@/components/ListingCard";
import { setWantStatus, deleteWant } from "@/actions/social";

export default async function WantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const w = getWant(Number(id));
  if (!w) notFound();
  const user = await getCurrentUser();
  const mine = user?.id === w.user_id;
  const maybe = searchListings({ category: w.category, maxPrice: w.max_price_cents ?? undefined, limit: 4 });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-muted">Wanted · {categoryLabel(w.category)}{w.status === "fulfilled" ? " · Found it ✅" : ""}</div>
        <h1 className="mt-1 text-2xl font-bold">{w.title}</h1>
        <p className="mt-1 text-lg font-bold">{w.max_price_cents !== null ? `Will pay up to ${money(w.max_price_cents)}` : "Open to any price"}</p>
        {w.description && <p className="mt-3 whitespace-pre-wrap">{w.description}</p>}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <Who id={w.user_id} name={w.user_name} house={w.user_house} gradYear={w.user_grad_year} />
          <span className="text-xs text-muted">{timeAgo(w.created_at)}</span>
        </div>
      </div>

      {mine ? (
        <div className="flex gap-2 rounded-2xl border border-accent/40 bg-card p-4">
          <form action={setWantStatus}><input type="hidden" name="id" value={w.id} /><input type="hidden" name="status" value={w.status === "open" ? "fulfilled" : "open"} />
            <button className="btn-primary">{w.status === "open" ? "Mark as found" : "Reopen"}</button></form>
          <form action={deleteWant}><input type="hidden" name="id" value={w.id} /><button className="btn-ghost text-free">Delete</button></form>
          <Link href="/listings/new" className="btn-ghost ml-auto">List something</Link>
        </div>
      ) : user ? (
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="mb-2 font-bold">Got one? Tell {w.user_name.split(" ")[0]}</h2>
          <MessageForm wantId={w.id} placeholder="Hey, I have one of these. It's…" />
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-4 text-sm"><Link href="/login" className="font-medium text-accent underline">Log in</Link> to reply.</div>
      )}

      {maybe.length > 0 && (
        <div><h2 className="mb-2 text-sm font-bold text-muted">Listings that might fit</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{maybe.map((l) => <ListingCard key={l.id} l={l} />)}</div></div>
      )}
    </div>
  );
}
