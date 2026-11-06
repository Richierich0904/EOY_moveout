import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { Badges } from "@/components/Badges";
import { badgesFor } from "@/lib/game";
import { classYear } from "@/lib/format";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = getDb().prepare("SELECT id, name, house, grad_year, created_at FROM users WHERE id = ? AND verified = 1").get(Number(id)) as
    { id: number; name: string; house: string; grad_year: number; created_at: string } | undefined;
  if (!u) notFound();
  const listings = searchListings({ userId: u.id });
  const rehomed = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold'").get(u.id) as { c: number }).c;
  const since = new Date(u.created_at.replace(" ", "T") + "Z").toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const first = u.name.split(" ")[0];
  return (
    <div className="grid gap-14">
      <header className="rise intro">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-fg text-[26px] font-semibold text-bg">{u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
        <p className="eyebrow">{u.house} · Class of {classYear(u.grad_year)}</p>
        <h1 className="text-[clamp(2.2rem,5vw,3.2rem)]">{u.name}</h1>
        <p className="sub">{rehomed} item{rehomed === 1 ? "" : "s"} rehomed · on Swap since {since}</p>
        <Badges list={badgesFor(u.id)} />
      </header>
      <section className="grid gap-5">
        <div className="reveal grid gap-1"><p className="eyebrow">On {first}&apos;s shelf</p><h2>Available from {first}</h2></div>
        {listings.length === 0 ? <p className="card p-8 text-center text-muted">Nothing right now.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{listings.map((l, i) => <div key={l.id} className="reveal" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}</div>
        )}
      </section>
    </div>
  );
}
