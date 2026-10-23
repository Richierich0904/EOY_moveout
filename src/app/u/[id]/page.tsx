import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { Who } from "@/components/Avatar";
import { Badges } from "@/components/Badges";
import { badgesFor } from "@/lib/game";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = getDb().prepare("SELECT id, name, house, grad_year, created_at FROM users WHERE id = ? AND verified = 1").get(Number(id)) as
    { id: number; name: string; house: string; grad_year: number; created_at: string } | undefined;
  if (!u) notFound();
  const listings = searchListings({ userId: u.id });
  const rehomed = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold'").get(u.id) as { c: number }).c;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card p-4">
        <Who id={u.id} name={u.name} house={u.house} gradYear={u.grad_year} />
        <span className="text-[13px] text-muted"><b>{rehomed}</b> items rehomed · member since {new Date(u.created_at.replace(" ", "T") + "Z").toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
      </div>
      <Badges list={badgesFor(u.id)} />
      <h2 className="text-xl font-bold">Available from {u.name.split(" ")[0]}</h2>
      {listings.length === 0 ? <p className="text-[13px] text-muted">Nothing right now.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div>}
    </div>
  );
}
