import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getListing, getListingImages, searchListings } from "@/lib/listings";
import { categoryLabel } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { ListingCard } from "@/components/ListingCard";
import { MessageForm } from "@/components/MessageForm";
import { OwnerControls } from "@/components/OwnerControls";
import { CreditPay } from "@/components/CreditPay";
import { Price } from "@/components/Price";
import { Badges } from "@/components/Badges";
import { Shelves } from "@/components/Shelves";
import { Who } from "@/components/Avatar";
import { getDb } from "@/lib/db";
import { confirmReceived } from "@/actions/game";
import { creditBalance } from "@/lib/game";
import { badgesFor } from "@/lib/progress";
import { Gallery } from "@/components/Gallery";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const l = getListing(Number(id));
  return { title: l ? `${l.title}` : "Not found" };
}

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reserved?: string; updated?: string }> }) {
  const { id } = await params;
  const { reserved, updated } = await searchParams;
  const l = getListing(Number(id));
  if (!l) notFound();
  const images = getListingImages(l.id);
  const user = await getCurrentUser();
  const mine = user?.id === l.user_id;
  const isBuyer = !!user && user.id === l.buyer_id;
  const balance = user && !mine && l.accepts_credits && l.price_cents > 0 ? creditBalance(user.id) : 0;
  const more = searchListings({ userId: l.user_id, limit: 9 }).filter((x) => x.id !== l.id).slice(0, 8);
  const rehomed = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold'").get(l.user_id) as { c: number }).c;
  const chatters = mine ? (getDb().prepare(
    `SELECT u.id, u.name FROM threads t JOIN users u ON u.id = CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END WHERE t.listing_id = ?`)
    .all(l.user_id, l.id) as { id: number; name: string }[]) : [];
  const first = l.seller_name.split(" ")[0];
  const available = l.status === "available";
  const status = available ? "Available" : l.status === "pending" ? "Reserved" : "Rehomed";
  const rows: [string, React.ReactNode][] = [
    ["Condition", l.condition],
    ...(l.course_code ? [["Course", <Link key="c" href={`/?q=${encodeURIComponent(l.course_code)}#browse`} className="a-link">{l.course_code}</Link>] as [string, React.ReactNode]] : []),
    ["Handoff", l.handoff === "fall" ? "Fall handoff · summer storage, collected at September move-in" : "Meet up this week"],
    ["Where", l.spot ?? "Anywhere on campus"],
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
            <h1 className="text-[clamp(1.5rem,2.6vw,2rem)] leading-[1]">{l.title}</h1>
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-4">
              <span className="text-[12px] text-muted">{l.accepts_credits === 1 && l.price_cents > 0 ? `No fees · or ⭐ ${l.price_cents / 100} credits` : "No fees · pay the seller directly"}</span>
              <Price cents={l.price_cents} size="lg" />
            </div>
          </div>

          {l.description && <p className="max-w-[36em] whitespace-pre-wrap text-[14px] leading-relaxed">{l.description}</p>}

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
            {reserved && <p className="bg-bg-deep p-3 text-[13px]">Reserved with your credits. Message {first} to arrange the handoff.</p>}
            {!available && !isBuyer && !mine && <p className="text-[13px] text-muted">{l.status === "sold" ? "This one found a home." : "Reserved for someone, but ask in case it falls through."}</p>}
            {isBuyer && l.status === "sold" && !l.received_at && (
              <form action={confirmReceived} className="grid gap-3 bg-bg-deep p-4 text-[13px]">
                <input type="hidden" name="id" value={l.id} />
                <p>{first} says this is yours now. Did you get it?{l.price_cents === 0 ? " Confirming earns them a lottery ticket." : ""}</p>
                <button className="btn-primary w-full">Yes, I received it</button>
              </form>
            )}
            {isBuyer && l.received_at && <p className="text-[13px] font-semibold">✓ You confirmed you received this.</p>}

            {mine ? (
              <div className="card p-5"><OwnerControls listingId={l.id} status={l.status} buyerId={l.buyer_id} chatters={chatters} /></div>
            ) : user ? (
              <>
                {l.accepts_credits === 1 && l.price_cents > 0 && available && <CreditPay listingId={l.id} priceCents={l.price_cents} balance={balance} />}
                <MessageForm listingId={l.id} placeholder={l.price_cents === 0 ? "Hi! Can I grab this? I can meet at…" : "Hi! Is this still available? I can meet at…"} buttonLabel={`Message ${first}`} />
              </>
            ) : (
              <Link href="/login" className="btn-primary w-full">Log in to message {first}</Link>
            )}
            <p className="text-[11.5px] text-muted">Meet somewhere public on campus, and look the item over before you pay.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Who id={l.user_id} name={l.seller_name} house={l.seller_house} gradYear={l.seller_grad_year} avatar={l.seller_avatar} />
            <span className="text-[11.5px] uppercase tracking-[.08em] text-muted">{rehomed} rehomed</span>
            <div className="w-full"><Badges list={badgesFor(l.user_id)} /></div>
          </div>
        </div>
      </div>

      {more.length > 0 && (
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
