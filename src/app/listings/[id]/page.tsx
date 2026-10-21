import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getListing, getListingImages, searchListings } from "@/lib/listings";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { Who } from "@/components/Avatar";
import { ListingCard } from "@/components/ListingCard";
import { MessageForm } from "@/components/MessageForm";
import { OwnerControls } from "@/components/OwnerControls";
import { getDb } from "@/lib/db";
import { CreditPay } from "@/components/CreditPay";
import { confirmReceived } from "@/actions/game";
import { creditBalance } from "@/lib/game";

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
  const more = searchListings({ userId: l.user_id, limit: 5 }).filter((x) => x.id !== l.id).slice(0, 4);
  // People the seller has talked to about this item: candidates for "mark as sold to".
  const chatters = mine ? (getDb().prepare(
    `SELECT u.id, u.name FROM threads t JOIN users u ON u.id = CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END WHERE t.listing_id = ?`)
    .all(l.user_id, l.id) as { id: number; name: string }[]) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {images.length ? (
            <div className="flex snap-x snap-mandatory overflow-x-auto">
              {images.map((f) => <img key={f} src={`/uploads/${f}`} alt={l.title} className="aspect-square w-full shrink-0 snap-center object-contain bg-line" />)}
            </div>
          ) : <div className="flex aspect-square items-center justify-center text-6xl text-muted">📦</div>}
          {images.length > 1 && <div className="p-2 text-center text-xs text-muted">Swipe for {images.length} photos</div>}
        </div>
        {l.description && <p className="mt-4 whitespace-pre-wrap">{l.description}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Category</dt><dd><Link href={`/?category=${l.category}`} className="underline">{categoryLabel(l.category)}</Link></dd></div>
          <div><dt className="text-muted">Condition</dt><dd>{l.condition}</dd></div>
          {l.accepts_credits === 1 && l.price_cents > 0 && <div><dt className="text-muted">Payment</dt><dd>Cash, app, or ⭐ {l.price_cents / 100} credits</dd></div>}
          {l.course_code && <div><dt className="text-muted">Course</dt><dd><Link href={`/?q=${encodeURIComponent(l.course_code)}`} className="underline">{l.course_code}</Link></dd></div>}
          <div><dt className="text-muted">Handoff</dt><dd>{l.handoff === "fall" ? "🍂 Goes into summer storage, handed over at move-in" : "Meet up now"}</dd></div>
          {l.spot && <div><dt className="text-muted">Where</dt><dd>{l.spot}</dd></div>}
          <div><dt className="text-muted">Listed</dt><dd>{timeAgo(l.created_at)}</dd></div>
        </dl>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{l.title}</h1>
            <span className={`text-2xl font-black ${l.price_cents === 0 ? "text-free" : ""}`}>{money(l.price_cents)}</span>
          </div>
          {reserved && <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium">Reserved with your credits. Message the seller to arrange the handoff.</p>}
          {l.status !== "available" && !isBuyer && <p className="mt-2 rounded-lg bg-line px-3 py-2 text-sm font-medium">{l.status === "sold" ? "This one&apos;s gone." : "Reserved for someone, but ask in case it falls through."}</p>}
          {isBuyer && l.status === "sold" && !l.received_at && (
            <form action={confirmReceived} className="mt-2 rounded-lg bg-accent/10 p-3 text-sm">
              <input type="hidden" name="id" value={l.id} />
              <p className="mb-2">{l.seller_name.split(" ")[0]} says this is yours now. Did you get it?{l.price_cents === 0 ? " Confirming earns them a lottery ticket." : ""}</p>
              <button className="btn-primary w-full">✅ Yes, I received it</button>
            </form>
          )}
          {isBuyer && l.received_at && <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-sm">✅ You confirmed you received this.</p>}
          {l.handoff === "fall" && <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-sm">🍂 <b>Fall handoff.</b> Claim it now, pick it up when you&apos;re back in September. Good for incoming students and anyone who can&apos;t take things home.</p>}
          <div className="mt-4 border-t border-line pt-4"><Who id={l.user_id} name={l.seller_name} house={l.seller_house} gradYear={l.seller_grad_year} /></div>
        </div>

        {mine ? (
          <OwnerControls listingId={l.id} status={l.status} buyerId={l.buyer_id} chatters={chatters} />
        ) : user ? (
          <div className="rounded-2xl border border-line bg-card p-4">
            {l.accepts_credits === 1 && l.price_cents > 0 && l.status === "available" && <div className="mb-3"><CreditPay listingId={l.id} priceCents={l.price_cents} balance={balance} /></div>}
            <h2 className="mb-2 font-bold">Message {l.seller_name.split(" ")[0]}</h2>
            <MessageForm listingId={l.id} placeholder={l.price_cents === 0 ? "Hi! Can I grab this? I can meet at…" : `Hi! Is this still available? I can do ${money(l.price_cents)} and meet at…`} />
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-card p-4 text-sm"><Link href="/login" className="font-medium text-accent underline">Log in</Link> to message the seller.</div>
        )}

        {more.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-bold text-muted">More from {l.seller_name.split(" ")[0]}</h2>
            <div className="grid grid-cols-2 gap-2">{more.map((x) => <ListingCard key={x.id} l={x} />)}</div>
          </div>
        )}
      </aside>
    </div>
  );
}
