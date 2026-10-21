import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { searchListings } from "@/lib/listings";
import { listWants } from "@/lib/social";
import { ListingCard } from "@/components/ListingCard";
import { Who } from "@/components/Avatar";
import { money } from "@/lib/format";
import { logout } from "@/actions/auth";
import { badgesFor, creditBalance, creditHistory } from "@/lib/game";
import { Badges } from "@/components/Badges";
import { timeAgo } from "@/lib/format";

export default async function MePage({ searchParams }: { searchParams: Promise<{ listed?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const { listed } = await searchParams;
  const listings = searchListings({ userId: user.id, status: "all" });
  const wants = listWants({ userId: user.id, status: "all" });
  const gone = listings.filter((l) => l.status === "sold");
  const earned = gone.reduce((a, l) => a + l.price_cents, 0);
  const badges = badgesFor(user.id);
  const credits = creditBalance(user.id);
  const history = creditHistory(user.id);
  const awaiting = listings.filter((l) => l.status === "sold" && l.buyer_id && !l.received_at);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4">
        <Who id={user.id} name={user.name} house={user.house} gradYear={user.grad_year} />
        <div className="flex gap-4 text-sm"><span><b>{listings.length}</b> listed</span><span><b>{gone.length}</b> rehomed</span><span><b>{money(earned)}</b> earned</span><span><b>⭐ {credits / 100}</b> credits</span></div>
        <div className="flex flex-wrap gap-2"><Link href="/listings/new?mode=bulk" className="btn-ghost">Clear out my room</Link><Link href="/listings/new" className="btn-primary">+ Sell</Link></div>
      </div>
      <div className="flex gap-2 sm:hidden"><Link href="/alerts" className="btn-ghost flex-1">🔔 Alerts</Link><Link href="/wanted" className="btn-ghost flex-1">🙋 Wanted</Link><Link href="/messages" className="btn-ghost flex-1">💬 Messages</Link><form action={logout} className="flex-1"><button className="btn-ghost w-full text-muted">Log out</button></form></div>
      <Badges list={badges} />
      {listed && <p className="rounded-lg bg-accent/10 p-3 text-sm">Posted {listed} items. Open any of them to add photos or details.</p>}
      {awaiting.length > 0 && <p className="rounded-lg border border-line bg-card p-3 text-sm">⏳ {awaiting.length} handoff{awaiting.length === 1 ? "" : "s"} waiting for the receiver to confirm. Giveaways only count for the <Link href="/lottery" className="underline">draw</Link> once they do, so give them a nudge.</p>}
      <section>
        <h2 className="mb-2 text-xl font-bold">My listings</h2>
        {listings.length === 0 ? <p className="text-sm text-muted">Nothing listed yet.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div>}
      </section>
      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-bold">Credits</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card text-sm">
            {history.map((h) => <li key={h.id} className="flex justify-between p-3"><span>{h.reason}</span><span className={`shrink-0 pl-3 font-bold ${h.delta < 0 ? "text-free" : "text-accent"}`}>{h.delta > 0 ? "+" : ""}{h.delta / 100} <span className="font-normal text-muted">· {timeAgo(h.created_at)}</span></span></li>)}
          </ul>
        </section>
      )}
      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-xl font-bold">My wanted posts</h2><Link href="/wanted/new" className="text-sm text-accent">+ New</Link></div>
        {wants.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
            {wants.map((w) => <li key={w.id}><Link href={`/wanted/${w.id}`} className="flex justify-between p-3 hover:bg-bg"><span>{w.status === "fulfilled" ? "✅ " : "🙋 "}{w.title}</span><span className="text-sm text-muted">{w.max_price_cents !== null ? `≤ ${money(w.max_price_cents)}` : "any"}</span></Link></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
