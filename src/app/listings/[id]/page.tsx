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
import { badgesFor, creditBalance } from "@/lib/game";
import { Gallery } from "@/components/Gallery";

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reserved?: string }> }) {
  const { id } = await params;
  const { reserved } = await searchParams;
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
  const status = available ? { text: "Available", cls: "text-moss-deep" } : l.status === "pending" ? { text: "Reserved", cls: "text-accent" } : { text: "Rehomed", cls: "text-muted" };

  return (
    <div className="grid grid-cols-1 gap-16 sm:gap-24">
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
        <div className="md:sticky md:top-[76px]"><Gallery images={images} title={l.title} /></div>

        <div className="rise grid min-w-0 gap-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted"><Link href="/" className="hover:text-accent">Shelves</Link> <span aria-hidden>›</span> <Link href={`/?category=${l.category}#browse`} className="hover:text-accent">{categoryLabel(l.category)}</Link></nav>
          <div className="grid gap-2">
            <p className="eyebrow">{categoryLabel(l.category)}{l.handoff === "fall" ? " · Fall handoff" : ""}</p>
            <h1 className="text-[clamp(2.1rem,4.4vw,3.2rem)]">{l.title}</h1>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Price cents={l.price_cents} size="lg" />
              {l.accepts_credits === 1 && l.price_cents > 0 && <span className="text-[14.5px] text-muted">or ⭐ {l.price_cents / 100} credits</span>}
              <span className={`text-[14.5px] font-semibold ${status.cls}`}>· {status.text}</span>
            </div>
          </div>

          {l.description && <p className="max-w-[34em] whitespace-pre-wrap text-[17px] leading-relaxed">{l.description}</p>}

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-4 text-[15px]">
            <dt className="text-muted">Condition</dt><dd>{l.condition}</dd>
            {l.course_code && (<><dt className="text-muted">Course</dt><dd><Link href={`/?q=${encodeURIComponent(l.course_code)}#browse`} className="a-link">{l.course_code}</Link></dd></>)}
            <dt className="text-muted">Handoff</dt><dd>{l.handoff === "fall" ? "Summer storage, collected at September move-in" : "Meet up this week"}</dd>
            <dt className="text-muted">Where</dt><dd>{l.spot ?? "Anywhere on campus"}</dd>
            <dt className="text-muted">Listed</dt><dd>{timeAgo(l.created_at)}</dd>
            <dt className="text-muted">Payment</dt><dd>Cash or any app you both use{l.accepts_credits === 1 && l.price_cents > 0 ? ", or credits" : ""}. No fees.</dd>
          </dl>

          <div className="card grid gap-4 p-5 sm:p-6">
            {reserved && <p className="rounded-[10px] bg-moss/12 p-3 text-[14.5px]">Reserved with your credits. Message {first} to arrange the handoff.</p>}
            {!available && !isBuyer && !mine && <p className="text-[14.5px] text-muted">{l.status === "sold" ? "This one found a home." : "Reserved for someone, but ask in case it falls through."}</p>}
            {isBuyer && l.status === "sold" && !l.received_at && (
              <form action={confirmReceived} className="grid gap-3 rounded-[10px] bg-moss/12 p-4 text-[14.5px]">
                <input type="hidden" name="id" value={l.id} />
                <p>{first} says this is yours now. Did you get it?{l.price_cents === 0 ? " Confirming earns them a lottery ticket." : ""}</p>
                <button className="btn-orange w-full">Yes, I received it</button>
              </form>
            )}
            {isBuyer && l.received_at && <p className="text-[14.5px] text-moss-deep">✓ You confirmed you received this.</p>}

            {mine ? (
              <OwnerControls listingId={l.id} status={l.status} buyerId={l.buyer_id} chatters={chatters} />
            ) : user ? (
              <>
                {l.accepts_credits === 1 && l.price_cents > 0 && available && <CreditPay listingId={l.id} priceCents={l.price_cents} balance={balance} />}
                <MessageForm listingId={l.id} placeholder={l.price_cents === 0 ? "Hi! Can I grab this? I can meet at…" : "Hi! Is this still available? I can meet at…"} buttonLabel={`Message ${first}`} />
              </>
            ) : (
              <Link href="/login" className="btn-primary w-full">Log in to message {first}</Link>
            )}
            <p className="text-[13px] text-muted">Meet somewhere public on campus, and look the item over before you pay.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Who id={l.user_id} name={l.seller_name} house={l.seller_house} gradYear={l.seller_grad_year} />
            <span className="text-[13.5px] text-muted">{rehomed} item{rehomed === 1 ? "" : "s"} rehomed</span>
            <div className="w-full"><Badges list={badgesFor(l.user_id)} /></div>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="grid grid-cols-1 gap-5">
          <div className="reveal flex items-end justify-between gap-3">
            <div className="grid gap-1"><p className="eyebrow">Same room</p><h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">More from {first}</h2></div>
            <Link href={`/u/${l.user_id}`} className="more">All of {first}&apos;s things</Link>
          </div>
          <div className="reveal">
            <Shelves label={`More from ${first}`}>
              {more.map((x) => <div key={x.id} className="w-[220px] shrink-0 snap-start"><ListingCard l={x} /></div>)}
            </Shelves>
          </div>
        </section>
      )}
    </div>
  );
}
