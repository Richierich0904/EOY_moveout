import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getListing, getListingImages, searchListings } from "@/lib/listings";
import { BOOST_COST, BOOST_DAYS, POINTS_GIVEAWAY, POINTS_SALE, categoryLabel } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { fmtDate } from "@/lib/time";
import { ListingCard } from "@/components/ListingCard";
import { MessageForm } from "@/components/MessageForm";
import { OwnerControls } from "@/components/OwnerControls";
import { ReportForm } from "@/components/ReportForm";
import { Price } from "@/components/Price";
import { Badges } from "@/components/Badges";
import { Shelves } from "@/components/Shelves";
import { Who } from "@/components/Avatar";
import { getDb } from "@/lib/db";
import { confirmReceived, declineReceived } from "@/actions/game";
import { removeListingNow, restoreListing } from "@/actions/moderation";
import { activeBoost, creditBalance } from "@/lib/game";
import { badgesFor, confirmedCount } from "@/lib/progress";
import { REPORT_REASONS, isBlocked } from "@/lib/moderation";
import { Gallery } from "@/components/Gallery";

export const metadata = { title: "Listing" };

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string; boosted?: string; locked?: string }> }) {
  const user = await requireViewer();
  const { id } = await params;
  const { updated, boosted, locked } = await searchParams;
  const l = getListing(Number(id));
  if (!l) notFound();
  const mine = user.id === l.user_id;
  const hidden = l.status === "review" || l.status === "removed";
  // Held and removed listings are only for their owner and the organisers.
  if (hidden && !mine && !user.is_admin) notFound();
  if (!mine && !user.is_admin && isBlocked(user.id, l.user_id)) notFound();
  const images = getListingImages(l.id);
  const isBuyer = user.id === l.buyer_id;
  const more = searchListings({ userId: l.user_id, limit: 9 }).filter((x) => x.id !== l.id).slice(0, 8);
  const rehomed = confirmedCount(l.user_id);
  const chatters = mine ? (getDb().prepare(
    `SELECT u.id, u.name FROM threads t JOIN users u ON u.id = CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END WHERE t.listing_id = ?`)
    .all(l.user_id, l.id) as { id: number; name: string }[]) : [];
  const first = l.seller_name.split(" ")[0];
  const available = l.status === "available";
  const status = available ? "Available" : l.status === "pending" ? "Reserved" : l.status === "sold" ? "Rehomed" : l.status === "review" ? "Being checked by an organiser" : "Removed";
  const running = mine ? activeBoost(user.id) : null;
  const rows: [string, React.ReactNode][] = [
    ["Condition", l.condition],
    ...(l.course_code ? [["Course", <Link key="c" href={`/?q=${encodeURIComponent(l.course_code)}#browse`} className="a-link">{l.course_code}</Link>] as [string, React.ReactNode]] : []),
    ["Handoff", l.handoff === "fall" ? "Fall handoff · summer storage, collected at September move-in" : "Meet up this week"],
    ["Where", l.spot ?? "A public spot on campus"],
    ["Listed", timeAgo(l.created_at)],
    ["Status", status],
  ];

  return (
    <div className="grid grid-cols-1 gap-20 sm:gap-28">
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12">
        <div className="md:sticky md:top-24"><Gallery images={images} title={l.title} /></div>

        <div className="rise grid min-w-0 gap-6">
          <p className="text-[11.5px] tracking-[.04em] text-muted"><Link href="/" className="hover:text-fg">Home</Link> / <Link href={`/?category=${l.category}#browse`} className="hover:text-fg">{categoryLabel(l.category)}</Link></p>
          <div className="grid gap-3">
            {!!l.boosted && <p className="w-fit border border-accent px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[.08em] text-accent">⭐ Boosted listing</p>}
            <h1 className="text-[clamp(1.5rem,2.6vw,2rem)] leading-[1]">{l.title}</h1>
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-4">
              <span className="text-[12px] text-muted">No fees · pay the seller in person</span>
              <Price cents={l.price_cents} size="lg" />
            </div>
          </div>

          {l.status === "review" && <p className="border border-fg p-3.5 text-[13.5px]"><b className="font-semibold">Waiting for a quick check.</b> This listing mentions something that might not be allowed, so an organiser will look at it before it goes on the shelves. See the <Link href="/rules" className="a-link">rules</Link>.</p>}
          {l.status === "removed" && <p className="border border-fg p-3.5 text-[13.5px]"><b className="font-semibold">Removed by an organiser.</b> {l.removed_reason ? `Reason: ${l.removed_reason}. ` : ""}See the <Link href="/rules" className="a-link">rules</Link> for what can be listed.</p>}

          {l.description && <p className="max-w-[36em] whitespace-pre-wrap break-words text-[14px] leading-relaxed">{l.description}</p>}

          <dl className="grid grid-cols-[auto_1fr] text-[13px]">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="border-t border-line py-2.5 pr-6 text-muted">{k}</dt>
                <dd className={`border-t border-line py-2.5 ${k === "Status" && available ? "font-semibold" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-3">
            {updated && mine && <p className="border border-fg px-3 py-2 text-[12px] font-semibold uppercase tracking-[.08em]">Updated</p>}
            {boosted && mine && <p className="border border-accent px-3 py-2 text-[12px] font-semibold uppercase tracking-[.08em] text-accent">Boosted for {BOOST_DAYS} days</p>}
            {locked && mine && <p className="bg-bg-deep p-3 text-[13px]">A confirmed handoff stays on the record, so this listing can&apos;t be deleted.</p>}
            {!available && !hidden && !isBuyer && !mine && <p className="text-[13px] text-muted">{l.status === "sold" ? "This one found a home." : "Reserved for someone, but ask in case it falls through."}</p>}
            {isBuyer && !l.received_at && (l.status === "sold" || l.status === "pending") && (
              <div className="grid gap-3 bg-bg-deep p-4 text-[13px]">
                {l.status === "sold" ? (
                  <>
                    <p>{first} says this is yours now. Did you get it? Confirming gives {first} {l.price_cents === 0 ? POINTS_GIVEAWAY : POINTS_SALE} points.</p>
                    <form action={confirmReceived}><input type="hidden" name="id" value={l.id} /><button className="btn-primary w-full">Yes, I received it</button></form>
                  </>
                ) : <p>{first} has reserved this for you. Arrange a time and a public spot in messages.</p>}
                <form action={declineReceived}><input type="hidden" name="id" value={l.id} /><button className="text-[12.5px] text-muted underline-offset-2 hover:text-fg hover:underline">{l.status === "sold" ? "I didn't get this" : "I don't want this any more"}</button></form>
              </div>
            )}
            {isBuyer && l.received_at && <p className="text-[13px] font-semibold">✓ You confirmed you received this.</p>}

            {mine ? (
              hidden ? null : (
                <div className="card p-5">
                  <OwnerControls listingId={l.id} status={l.status} buyerId={l.buyer_id} chatters={chatters} confirmed={!!l.received_at} hasPhoto={images.length > 0}
                    boost={{ active: !!l.boosted, until: l.boosted_until ? fmtDate(l.boosted_until, { weekday: "long", month: "short", day: "numeric" }) : null, cost: BOOST_COST, days: BOOST_DAYS, balance: creditBalance(user.id), other: running && running.id !== l.id ? running.title : null }} />
                </div>
              )
            ) : !hidden && (
              <MessageForm listingId={l.id} placeholder={l.price_cents === 0 ? "Hi! Can I grab this? I can meet at…" : "Hi! Is this still available? I can meet at…"} buttonLabel={`Message ${first}`} />
            )}
            <p className="text-[11.5px] text-muted">Meet at a public spot on campus, never in a dorm room, and look the item over before you pay. <Link href="/help" className="underline underline-offset-2 hover:text-fg">Safety tips</Link></p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Who id={l.user_id} name={l.seller_name} house={l.seller_house} gradYear={l.seller_grad_year} avatar={l.seller_avatar} />
            <span className="text-[11.5px] uppercase tracking-[.08em] text-muted">{rehomed} rehomed</span>
            <div className="w-full"><Badges list={badgesFor(l.user_id)} /></div>
          </div>

          {!mine && !hidden && <ReportForm type="listing" id={l.id} reasons={REPORT_REASONS} what="this listing" />}

          {user.is_admin && !mine && (
            <div className="grid gap-3 border border-fg p-4 text-[13px]" data-admin>
              <p className="eyebrow">Organiser</p>
              {l.status === "removed" ? (
                <form action={restoreListing}><input type="hidden" name="id" value={l.id} /><button className="btn-ghost">Put it back on the shelves</button></form>
              ) : (
                <form action={removeListingNow} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="id" value={l.id} />
                  <label className="sr-only" htmlFor="admin-reason">Reason</label>
                  <input id="admin-reason" name="reason" maxLength={200} placeholder="Reason (the student sees it)" className="input" />
                  <button className="btn-ghost">Remove listing</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {more.length > 0 && !hidden && (
        <section className="grid grid-cols-1 gap-8">
          <div className="reveal flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] leading-[.9]">More from<br />{first}<span className="count ml-1">({more.length})</span></h2>
            <Link href={`/u/${l.user_id}`} className="text-[12px] tracking-[.03em] underline-offset-4 hover:underline">See all</Link>
          </div>
          <div className="reveal">
            <Shelves label={`More from ${first}`}>
              {more.map((x) => <div key={x.id} className="w-[min(62vw,230px)] shrink-0 snap-start"><ListingCard l={x} /></div>)}
            </Shelves>
          </div>
        </section>
      )}
    </div>
  );
}
