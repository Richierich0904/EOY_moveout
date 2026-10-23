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
  const more = searchListings({ userId: l.user_id, limit: 7 }).filter((x) => x.id !== l.id).slice(0, 6);
  const rehomed = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE user_id = ? AND status = 'sold'").get(l.user_id) as { c: number }).c;
  const chatters = mine ? (getDb().prepare(
    `SELECT u.id, u.name FROM threads t JOIN users u ON u.id = CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END WHERE t.listing_id = ?`)
    .all(l.user_id, l.id) as { id: number; name: string }[]) : [];
  const first = l.seller_name.split(" ")[0];
  const available = l.status === "available";

  return (
    <div className="space-y-4">
      <nav className="text-[12px] text-muted"><Link href="/" className="a-link">Home</Link> › <Link href={`/?category=${l.category}`} className="a-link">{categoryLabel(l.category)}</Link> › <span>{l.title}</span></nav>

      <div className="card grid gap-5 p-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
        {/* Gallery */}
        <Gallery images={images} title={l.title} />

        {/* Info column */}
        <div className="min-w-0">
          <h1 className="text-[24px] leading-tight">{l.title}</h1>
          <Link href={`/u/${l.user_id}`} className="a-link text-[14px]">Visit {first}&apos;s profile</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span>{rehomed} item{rehomed === 1 ? "" : "s"} rehomed</span>·<span>Listed {timeAgo(l.created_at)}</span>
            {l.handoff === "fall" && <span className="rounded-sm bg-subheader px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Fall handoff</span>}
          </div>
          <hr className="my-3 border-line" />
          <div className="flex items-end gap-3"><Price cents={l.price_cents} size="lg" />{l.accepts_credits === 1 && l.price_cents > 0 && <span className="pb-1 text-[13px] text-muted">or ⭐ {l.price_cents / 100} credits</span>}</div>
          <p className="mt-1 text-[13px] text-muted">No fees. Pay the seller directly in cash or any app you both use.</p>
          <hr className="my-3 border-line" />
          <h2 className="text-[16px]">About this item</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px]">
            <li><b>Condition:</b> {l.condition}</li>
            <li><b>Category:</b> {categoryLabel(l.category)}</li>
            {l.course_code && <li><b>Course:</b> <Link href={`/?q=${encodeURIComponent(l.course_code)}`} className="a-link">{l.course_code}</Link></li>}
            <li><b>Handoff:</b> {l.handoff === "fall" ? "Goes into summer storage, handed over at move-in in September. Great for incoming students and anyone who can't take it home." : "Meet up this week"}{l.spot ? ` · ${l.spot}` : ""}</li>
            <li><b>Seller:</b> {l.seller_name}, {l.seller_house}, Class of &apos;{String(l.seller_grad_year).slice(-2)}</li>
          </ul>
          {l.description && (<><h2 className="mt-4 text-[16px]">Description</h2><p className="mt-1 whitespace-pre-wrap text-[14px]">{l.description}</p></>)}
        </div>

        {/* Buy box */}
        <div className="h-fit rounded-lg border border-line p-4 lg:sticky lg:top-[92px]">
          <Price cents={l.price_cents} size="lg" />
          <p className="mt-1 text-[14px]"><span className="font-bold">FREE pickup</span> {l.spot ? `at ${l.spot}` : "on campus"}</p>
          <p className="mt-2 text-[16px] font-medium">
            {available ? <span className="text-ok">Available</span> : l.status === "pending" ? <span className="text-price">Reserved</span> : <span className="text-muted">Gone</span>}
          </p>
          {l.handoff === "fall" && <p className="mt-1 text-[13px] text-muted">🍂 Claim now, collect at September move-in.</p>}
          {reserved && <p className="mt-2 rounded-md bg-[#fffbf3] p-2 text-[13px]">Reserved with your credits. Message {first} to arrange the handoff.</p>}
          {!available && !isBuyer && !mine && <p className="mt-2 text-[13px] text-muted">{l.status === "sold" ? "This one found a home." : "Reserved for someone, but ask in case it falls through."}</p>}
          {isBuyer && l.status === "sold" && !l.received_at && (
            <form action={confirmReceived} className="mt-3 rounded-md bg-[#f0f8f0] p-3 text-[13px]">
              <input type="hidden" name="id" value={l.id} />
              <p className="mb-2">{first} says this is yours now. Did you get it?{l.price_cents === 0 ? " Confirming earns them a lottery ticket." : ""}</p>
              <button className="btn-primary w-full">Yes, I received it</button>
            </form>
          )}
          {isBuyer && l.received_at && <p className="mt-2 text-[13px] text-ok">✓ You confirmed you received this.</p>}

          <div className="mt-3">
            {mine ? (
              <OwnerControls listingId={l.id} status={l.status} buyerId={l.buyer_id} chatters={chatters} />
            ) : user ? (
              <>
                {l.accepts_credits === 1 && l.price_cents > 0 && available && <div className="mb-3"><CreditPay listingId={l.id} priceCents={l.price_cents} balance={balance} /></div>}
                <MessageForm listingId={l.id} placeholder={l.price_cents === 0 ? "Hi! Can I grab this? I can meet at…" : `Hi! Is this still available? I can meet at…`} buttonLabel={`Message ${first}`} />
              </>
            ) : (
              <Link href="/login" className="btn-primary w-full">Sign in to message {first}</Link>
            )}
          </div>
          <p className="mt-3 text-[12px] text-muted">🔒 Meet somewhere public on campus. Never pay before you&apos;ve seen the item.</p>
          <hr className="my-3 border-line" />
          <div className="text-[12px] text-muted">Sold by <Link href={`/u/${l.user_id}`} className="a-link">{l.seller_name}</Link></div>
          <div className="mt-1"><Badges list={badgesFor(l.user_id)} /></div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-3 text-[18px]">More from {first}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{more.map((x) => <ListingCard key={x.id} l={x} />)}</div>
        </section>
      )}
    </div>
  );
}
