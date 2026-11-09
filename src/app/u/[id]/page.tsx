import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { Badges } from "@/components/Badges";
import { Face } from "@/components/Avatar";
import { awardsFor, badgesFor, myRanks, personalTotals } from "@/lib/progress";
import { classYear } from "@/lib/format";
import { APP_NAME } from "@/lib/config";

export const metadata = { title: "Profile" };

const PERIOD_NAME = { week: "This week", month: "This month", year: "School year" } as const;
const PLACE = ["1st", "2nd", "3rd"];

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = getDb().prepare("SELECT id, name, house, grad_year, created_at, avatar FROM users WHERE id = ? AND verified = 1").get(Number(id)) as
    { id: number; name: string; house: string; grad_year: number; created_at: string; avatar: string | null } | undefined;
  if (!u) notFound();
  const listings = searchListings({ userId: u.id });
  const totals = personalTotals(u.id);
  const ranks = myRanks(u.id);
  const awards = awardsFor(u.id);
  const since = new Date(u.created_at.replace(" ", "T") + "Z").toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const first = u.name.split(" ")[0];
  return (
    <div className="grid gap-14">
      <header className="rise grid gap-4">
        <Face name={u.name} avatar={u.avatar} size={88} />
        <p className="eyebrow">{u.house} · Class of {classYear(u.grad_year)}</p>
        <h1 className="text-[clamp(2.2rem,5vw,3.2rem)]">{u.name}</h1>
        <p className="sub">{totals.handoffs} item{totals.handoffs === 1 ? "" : "s"} rehomed · {totals.points} points{totals.streak > 1 ? ` · ${totals.streak}-week streak` : ""} · on {APP_NAME} since {since}</p>
        <Badges list={badgesFor(u.id)} />
      </header>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-5">
        {ranks.map((r) => (
          <div key={r.window.period} className="card reveal flex items-end justify-between gap-3 p-5">
            <span className="grid gap-1"><span className="eyebrow">{PERIOD_NAME[r.window.period]}</span><span className="text-[12.5px] text-muted">{r.points} pts</span></span>
            <span className={`display text-[34px] leading-none tabular-nums ${r.rank === 1 ? "text-accent" : ""}`}>{r.rank ? `#${r.rank}` : "–"}</span>
          </div>
        ))}
      </section>

      {awards.length > 0 && (
        <section className="grid gap-4">
          <div className="reveal grid gap-1"><p className="eyebrow">Trophy shelf</p><h2>Prizes won</h2></div>
          <ul className="flex flex-wrap gap-2">
            {awards.map((a) => <li key={a.id} className="card reveal px-3.5 py-2 text-[13px]"><b className="display mr-2 text-accent">{PLACE[a.place - 1] ?? `#${a.place}`}</b>{a.label}</li>)}
          </ul>
        </section>
      )}

      <section className="grid gap-5">
        <div className="reveal grid gap-1"><p className="eyebrow">On {first}&apos;s shelf</p><h2>Available from {first}</h2></div>
        {listings.length === 0 ? <p className="card p-8 text-muted">Nothing right now.</p> : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{listings.map((l, i) => <div key={l.id} className="reveal min-w-0" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}</div>
        )}
      </section>
    </div>
  );
}
