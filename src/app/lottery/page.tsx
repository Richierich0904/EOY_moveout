import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { GIVEAWAYS_PER_TICKET } from "@/lib/config";
import { currentDraw, entrants, giveawaysInWindow, pastDraws, prizesFor, runDueDraws, ticketsFor } from "@/lib/game";
import { money } from "@/lib/format";

function when(iso: string) { return new Date(iso.replace(" ", "T") + "Z").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }

export default async function LotteryPage() {
  runDueDraws();
  const user = await getCurrentUser();
  const draw = currentDraw();
  const prizes = draw ? prizesFor(draw.id) : [];
  const pool = draw ? entrants(draw) : [];
  const totalTickets = pool.reduce((a, e) => a + e.tickets, 0);
  const myGiveaways = user && draw ? giveawaysInWindow(user.id, draw.starts_at, draw.ends_at) : 0;
  const myTickets = ticketsFor(myGiveaways);
  const toNext = GIVEAWAYS_PER_TICKET - (myGiveaways % GIVEAWAYS_PER_TICKET);
  const past = pastDraws();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🎟️ The giveaway draw</h1>
        <p className="text-[13px] text-muted">Every {GIVEAWAYS_PER_TICKET} items you give away for free earns a ticket. A giveaway counts once the person who got it confirms they received it. Winners are drawn automatically when the clock runs out.</p>
      </div>

      {draw ? (
        <section className="rounded-lg border border-line bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">{draw.title}</h2>
            <span className="text-[13px] text-muted">Draws {when(draw.ends_at)}</span>
          </div>
          {draw.description && <p className="mt-1 text-sm">{draw.description}</p>}
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {prizes.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg bg-bg p-3">
                <span className="text-2xl">{["🥇", "🥈", "🥉"][i] ?? "🎁"}</span>
                <span><span className="block font-medium">{p.title}</span>{p.credit_cents > 0 && <span className="text-[12px] text-muted">⭐ {p.credit_cents / 100} credits, spend on any listing that takes them</span>}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg bg-[#fffbf3] p-4">
            {user ? (
              <>
                <div className="flex items-baseline justify-between"><span className="font-bold">Your tickets</span><span className="text-3xl font-black">{myTickets}</span></div>
                <p className="text-sm">{myGiveaways} confirmed giveaway{myGiveaways === 1 ? "" : "s"} this round. {toNext === GIVEAWAYS_PER_TICKET && myGiveaways > 0 ? "Nice, that's a full ticket." : `${toNext} more for your next ticket.`}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className="h-2 bg-accent" style={{ width: `${((myGiveaways % GIVEAWAYS_PER_TICKET) / GIVEAWAYS_PER_TICKET) * 100}%` }} /></div>
                {totalTickets > 0 && myTickets > 0 && <p className="mt-2 text-[12px] text-muted">Roughly a {Math.round((myTickets / totalTickets) * 100)}% shot at the first prize right now.</p>}
                <Link href="/listings/new?mode=bulk" className="btn-primary mt-3">Give stuff away</Link>
              </>
            ) : (
              <p className="text-sm"><Link href="/signup" className="a-link font-medium">Join</Link> to start earning tickets.</p>
            )}
          </div>

          <div className="mt-4 text-sm text-muted">
            {pool.length === 0 ? "Nobody has a ticket yet. First to give away " + GIVEAWAYS_PER_TICKET + " items is the favourite." : (
              <>{pool.length} {pool.length === 1 ? "person" : "people"} in the hat with {totalTickets} tickets. Top givers: {pool.slice(0, 5).map((e) => `${e.name.split(" ")[0]} (${e.tickets})`).join(", ")}.</>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-line p-6 text-center text-muted">
          <p className="text-lg">No draw running right now.</p>
          <p className="text-sm">Giveaways still count for badges and the house leaderboard. {user?.is_admin && <Link href="/admin" className="a-link">Start a draw</Link>}</p>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Past winners</h2>
          <ul className="space-y-2">
            {past.map((d) => (
              <li key={d.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex justify-between"><span className="font-medium">{d.title}</span><span className="text-[12px] text-muted">{when(d.drawn_at!)}</span></div>
                <ul className="mt-1 text-sm">
                  {prizesFor(d.id).map((p) => <li key={p.id}>{p.winner_name ? <><b>{p.winner_name}</b> won {p.title}</> : <span className="text-muted">{p.title}: no entrants</span>}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-[12px] text-muted">Credits are play money inside this app, worth {money(100)} each when a seller chooses to accept them. They can&apos;t be cashed out.</p>
    </div>
  );
}
