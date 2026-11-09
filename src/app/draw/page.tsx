import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { BOOST_COST, BOOST_DAYS, GIVEAWAYS_PER_TICKET } from "@/lib/config";
import { currentDraw, entrants, giveawaysInWindow, pastDraws, prizesFor, ticketsFor } from "@/lib/game";
import { fmtDateTime } from "@/lib/time";
import { DrawSteps } from "@/components/DrawSteps";
import { PageIntro } from "@/components/PageIntro";

const PLACE = ["First prize", "Second prize", "Third prize"];

export const metadata = { title: "Giveaway draw" };

export default async function DrawPage() {
  const user = await requireViewer();
  const draw = currentDraw();
  const prizes = draw ? prizesFor(draw.id) : [];
  const pool = draw ? entrants(draw) : [];
  const totalEntries = pool.reduce((a, e) => a + e.tickets, 0);
  const myGiveaways = draw ? giveawaysInWindow(user.id, draw.starts_at, draw.ends_at) : 0;
  const myEntries = ticketsFor(myGiveaways);
  const toNext = GIVEAWAYS_PER_TICKET - (myGiveaways % GIVEAWAYS_PER_TICKET);
  const past = pastDraws();

  return (
    <div className="grid max-w-4xl gap-16 sm:gap-24">
      {draw ? (
        <section className="grid gap-10">
          <PageIntro eyebrow={`The giveaway draw · winners picked ${fmtDateTime(draw.ends_at)}`} title={draw.title} sub={draw.description || `Every ${GIVEAWAYS_PER_TICKET} things you give away earns an entry.`} />
          <div className={`grid gap-4 ${prizes.length >= 3 ? "sm:grid-cols-3" : prizes.length === 2 ? "sm:grid-cols-2" : ""}`}>
            {prizes.map((p, i) => (
              <div key={p.id} className="card reveal grid content-start gap-2 p-5" style={{ ["--i" as string]: i }}>
                <span className="eyebrow">{PLACE[i] ?? "Prize"}</span>
                <span className="display text-[22px] leading-snug">{p.title}</span>
                {p.credit_cents > 0 && <span className="text-[13.5px] text-muted">⭐ {p.credit_cents / 100} credits, for boosting your listings</span>}
              </div>
            ))}
          </div>

          <div className="card reveal grid gap-5 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-8">
            <div className="grid justify-items-center gap-1 sm:justify-items-start">
              <span className="eyebrow">Your entries</span>
              <span data-tickets className="display text-[72px] leading-none">{myEntries}</span>
            </div>
            <div className="grid gap-3">
              <p className="text-[16.5px]">{myGiveaways} confirmed giveaway{myGiveaways === 1 ? "" : "s"} this round. {toNext === GIVEAWAYS_PER_TICKET && myGiveaways > 0 ? "That's a full entry." : `${toNext} more for your next entry.`}</p>
              <div className="h-2 overflow-hidden bg-line"><div className="h-2 bg-fg transition-[width] duration-700" style={{ width: `${((myGiveaways % GIVEAWAYS_PER_TICKET) / GIVEAWAYS_PER_TICKET) * 100}%` }} /></div>
              <div><Link href="/listings/new?mode=bulk" className="btn-primary">Give stuff away</Link></div>
            </div>
          </div>

          <p className="reveal text-[15px] text-muted">
            {pool.length === 0 ? `Nobody is in yet. Give away ${GIVEAWAYS_PER_TICKET} things to be the first.`
              : `${pool.length} ${pool.length === 1 ? "student is" : "students are"} in so far, with ${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} between them.`}
          </p>
        </section>
      ) : (
        <section className="grid gap-6">
          <PageIntro eyebrow="The giveaway draw" title="No draw running right now." sub="Giveaways still earn points, badges and credits, and count for your dorm." >
            {user.is_admin && <Link href="/admin" className="btn-primary">Start a draw</Link>}
          </PageIntro>
        </section>
      )}

      <section className="grid gap-8">
        <div className="intro reveal"><p className="eyebrow">How it works</p><h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Three steps to an entry.</h2></div>
        <div className="reveal"><DrawSteps perTicket={GIVEAWAYS_PER_TICKET} /></div>
      </section>

      {past.length > 0 && (
        <section className="grid gap-6">
          <div className="intro reveal"><p className="eyebrow">Past winners</p><h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Already drawn</h2></div>
          <ul className="grid gap-4">
            {past.map((d) => (
              <li key={d.id} className="card reveal grid gap-3 p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="display text-[21px]">{d.title}</span><span className="text-[13px] text-muted">{fmtDateTime(d.drawn_at!)}</span></div>
                <ul className="grid gap-1 text-[15px]">
                  {prizesFor(d.id).map((p) => <li key={p.id}>{p.winner_name ? <><b className="font-semibold">{p.winner_name}</b> won {p.title}</> : <span className="text-muted">{p.title}: no winner</span>}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-[13px] text-muted">It&apos;s free to take part and nothing is ever paid to enter. Entries only come from giving things away. Credits can&apos;t be bought, sent to anyone or turned into money. They boost a listing to the top of the shelves for {BOOST_DAYS} days (⭐ {BOOST_COST / 100} a boost).</p>
    </div>
  );
}
