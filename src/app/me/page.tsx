import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { searchListings } from "@/lib/listings";
import { listWants } from "@/lib/social";
import { ListingCard } from "@/components/ListingCard";
import { money, timeAgo, classYear } from "@/lib/format";
import { logout } from "@/actions/auth";
import { badgesFor, creditBalance, creditHistory } from "@/lib/game";
import { Badges } from "@/components/Badges";

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
  const stats: [string, string | number][] = [["Listed", listings.length], ["Rehomed", gone.length], ["Earned", money(earned)], ["Credits", `⭐ ${credits / 100}`]];

  return (
    <div className="grid gap-14 sm:gap-20">
      <header className="rise grid gap-4">
        <p className="eyebrow">{user.house} · Class of {classYear(user.grad_year)}</p>
        <h1 className="text-[clamp(2.4rem,5vw,3.6rem)]">{user.name}</h1>
        <Badges list={badges} />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
          {stats.map(([k, v]) => (
            <div key={k} className="card grid gap-0.5 p-4 sm:p-5"><span className="display text-[28px] leading-none tabular-nums">{v}</span><span className="text-[13px] text-muted">{k}</span></div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/listings/new" className="btn-primary">Sell something</Link>
          <Link href="/listings/new?mode=bulk" className="btn-ghost">Clear out my room</Link>
          <Link href="/alerts" className="btn-ghost">Alerts &amp; saved searches</Link>
          <Link href="/messages" className="btn-ghost">Messages</Link>
          <Link href="/wanted" className="btn-ghost sm:hidden">Wanted</Link>
          {user.is_admin && <Link href="/admin" className="btn-ghost">Organisers</Link>}
          <form action={logout} className="sm:ml-auto"><button className="btn-ghost text-muted">Sign out</button></form>
        </div>
      </header>

      {(listed || awaiting.length > 0) && (
        <div className="-mt-6 grid gap-3">
          {listed && <p className="bg-bg-deep p-4 text-[15px]">Posted {listed} items. Open any of them to add photos or details.</p>}
          {awaiting.length > 0 && <p className="card p-4 text-[15px]">{awaiting.length} handoff{awaiting.length === 1 ? " is" : "s are"} waiting for the receiver to confirm. Giveaways only count for the <Link href="/lottery" className="a-link">draw</Link> once they do, so give them a nudge.</p>}
        </div>
      )}

      <section className="grid gap-5">
        <div className="reveal flex items-end justify-between gap-3"><div className="grid gap-1"><p className="eyebrow">Your shelf</p><h2>My listings</h2></div><Link href="/listings/new" className="more">List another</Link></div>
        {listings.length === 0 ? <p className="card p-8 text-center text-muted">Nothing listed yet.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{listings.map((l, i) => <div key={l.id} className="reveal" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}</div>
        )}
      </section>

      {history.length > 0 && (
        <section className="grid gap-5">
          <div className="reveal grid gap-1"><p className="eyebrow">Balance ⭐ {credits / 100}</p><h2>Credits</h2></div>
          <ul className="card reveal divide-y divide-line overflow-hidden">
            {history.map((h) => (
              <li key={h.id} className="flex items-baseline justify-between gap-3 px-5 py-3.5 text-[15px]">
                <span>{h.reason}</span>
                <span className="shrink-0 text-right"><span className={`display text-[18px] tabular-nums ${h.delta < 0 ? "text-accent-deep" : "text-fg"}`}>{h.delta > 0 ? "+" : ""}{h.delta / 100}</span> <span className="text-[12.5px] text-muted">· {timeAgo(h.created_at)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-5">
        <div className="reveal flex items-end justify-between gap-3"><div className="grid gap-1"><p className="eyebrow">What you&apos;re after</p><h2>My wanted posts</h2></div><Link href="/wanted/new" className="more">New wanted post</Link></div>
        {wants.length === 0 ? <p className="card p-8 text-center text-muted">None yet.</p> : (
          <ul className="card reveal divide-y divide-line overflow-hidden">
            {wants.map((w) => (
              <li key={w.id}><Link href={`/wanted/${w.id}`} className="flex items-baseline justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bg">
                <span className="font-semibold">{w.title}{w.status === "fulfilled" && <span className="ml-2 text-[13px] font-medium text-fg">Found</span>}</span>
                <span className="text-[14px] text-muted">{w.max_price_cents !== null ? `up to ${money(w.max_price_cents)}` : "any price"}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
