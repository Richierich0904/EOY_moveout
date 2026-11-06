import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { GIVEAWAYS_PER_TICKET } from "@/lib/config";
import { currentDraw, entrants, giveawaysInWindow, pastDraws, prizesFor, runDueDraws, ticketsFor } from "@/lib/game";
import { money } from "@/lib/format";
import { DrawSteps } from "@/components/DrawSteps";
import { PageIntro } from "@/components/PageIntro";

function when(iso: string) { return new Date(iso.replace(" ", "T") + "Z").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
const PLACE = ["First prize", "Second prize", "Third prize"];

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
    <div className="mx-auto grid max-w-4xl gap-16 sm:gap-24">
      {draw ? (
        <section className="grid gap-10">
          <PageIntro eyebrow={`The giveaway draw · draws ${when(draw.ends_at)}`} title={draw.title} sub={draw.description || `Every ${GIVEAWAYS_PER_TICKET} things you give away earns a ticket.`} />
          <div className={`grid gap-4 ${prizes.length >= 3 ? "sm:grid-cols-3" : prizes.length === 2 ? "sm:grid-cols-2" : ""}`}>
            {prizes.map((p, i) => (
              <div key={p.id} className="card reveal grid content-start gap-2 p-5" style={{ ["--i" as string]: i }}>
                <span className="eyebrow">{PLACE[i] ?? "Prize"}</span>
                <span className="display text-[22px] leading-snug">{p.title}</span>
                {p.credit_cents > 0 && <span className="text-[13.5px] text-muted">⭐ {p.credit_cents / 100} credits, spendable on any listing that takes them</span>}
              </div>
            ))}
          </div>

          <div className="card reveal grid gap-5 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-8">
            {user ? (
              <>
                <div className="grid justify-items-center gap-1 sm:justify-items-start">
                  <span className="eyebrow">Your tickets</span>
                  <span data-tickets className="display text-[72px] leading-none">{myTickets}</span>
                </div>
                <div className="grid gap-3">
                  <p className="text-[16.5px]">{myGiveaways} confirmed giveaway{myGiveaways === 1 ? "" : "s"} this round. {toNext === GIVEAWAYS_PER_TICKET && myGiveaways > 0 ? "That's a full ticket." : `${toNext} more for your next ticket.`}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-2 rounded-full bg-moss transition-[width] duration-700" style={{ width: `${((myGiveaways % GIVEAWAYS_PER_TICKET) / GIVEAWAYS_PER_TICKET) * 100}%` }} /></div>
                  {totalTickets > 0 && myTickets > 0 && <p className="text-[13.5px] text-muted">Roughly a {Math.round((myTickets / totalTickets) * 100)}% shot at first prize right now.</p>}
                  <div><Link href="/listings/new?mode=bulk" className="btn-primary">Give stuff away</Link></div>
                </div>
              </>
            ) : (
              <p className="text-[16px] sm:col-span-2"><Link href="/signup" className="a-link font-semibold">Join with your school email</Link> to start earning tickets.</p>
            )}
          </div>

          <p className="reveal text-center text-[15px] text-muted">
            {pool.length === 0 ? `Nobody has a ticket yet. First to give away ${GIVEAWAYS_PER_TICKET} things is the favourite.` : (
              <>{pool.length} {pool.length === 1 ? "person" : "people"} in the hat with {totalTickets} ticket{totalTickets === 1 ? "" : "s"}. Leading: {pool.slice(0, 5).map((e) => `${e.name.split(" ")[0]} (${e.tickets})`).join(", ")}.</>
            )}
          </p>
        </section>
      ) : (
        <section className="grid gap-6">
          <PageIntro eyebrow="The giveaway draw" title="No draw running right now." sub="Giveaways still count for badges and the house cup." >
            {user?.is_admin && <Link href="/admin" className="btn-primary">Start a draw</Link>}
          </PageIntro>
        </section>
      )}

      <section className="grid gap-8">
        <div className="intro reveal"><p className="eyebrow">How it works</p><h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Three steps to a ticket.</h2></div>
        <div className="reveal"><DrawSteps perTicket={GIVEAWAYS_PER_TICKET} /></div>
      </section>

      {past.length > 0 && (
        <section className="grid gap-6">
          <div className="intro reveal"><p className="eyebrow">Past winners</p><h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Already drawn</h2></div>
          <ul className="grid gap-4">
            {past.map((d) => (
              <li key={d.id} className="card reveal grid gap-3 p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="display text-[21px]">{d.title}</span><span className="text-[13px] text-muted">{when(d.drawn_at!)}</span></div>
                <ul className="grid gap-1 text-[15px]">
                  {prizesFor(d.id).map((p) => <li key={p.id}>{p.winner_name ? <><b className="font-semibold">{p.winner_name}</b> won {p.title}</> : <span className="text-muted">{p.title}: no entrants</span>}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-[13px] text-muted">Credits are play money inside {"this app"}, worth {money(100)} each when a seller chooses to accept them. They can&apos;t be cashed out.</p>
    </div>
  );
}
