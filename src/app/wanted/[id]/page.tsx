import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getWant } from "@/lib/social";
import { searchListings } from "@/lib/listings";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { REPORT_REASONS, isBlocked } from "@/lib/moderation";
import { describeHold } from "@/lib/judge";
import { Who } from "@/components/Avatar";
import { MessageForm } from "@/components/MessageForm";
import { ListingCard } from "@/components/ListingCard";
import { ReportForm } from "@/components/ReportForm";
import { setWantStatus, deleteWant } from "@/actions/social";

export const metadata = { title: "Wanted" };

export default async function WantPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireViewer();
  const { id } = await params;
  const w = getWant(Number(id));
  if (!w) notFound();
  const mine = user.id === w.user_id;
  const hidden = w.status === "review" || w.status === "removed";
  if (hidden && !mine && !user.is_admin) notFound();
  if (!mine && !user.is_admin && isBlocked(user.id, w.user_id)) notFound();
  const maybe = hidden ? [] : searchListings({ category: w.category, maxPrice: w.max_price_cents ?? undefined, limit: 4, viewerId: user.id });
  const first = w.user_name.split(" ")[0];

  return (
    <div className="grid max-w-3xl gap-12">
      <header className="rise grid gap-3">
        <p className="eyebrow">Wanted · {categoryLabel(w.category)}{w.status === "fulfilled" ? " · Found" : ""}</p>
        <h1 className="text-[clamp(2.2rem,5vw,3.4rem)]">{w.title}</h1>
        <p className="display text-[22px] text-muted">{w.max_price_cents !== null ? `Will pay up to ${money(w.max_price_cents)}` : "Open to any price"}</p>
        {w.status === "review" && <p className="border border-fg p-3.5 text-[13.5px]"><b className="font-semibold">Waiting for a quick check.</b> An organiser will look at this post before it goes on the board.{describeHold(w.held_reason).student ? ` It may include ${describeHold(w.held_reason).student}.` : " It mentions something that might not be allowed."} See the <Link href="/rules" className="a-link">rules</Link>.</p>}
        {w.status === "removed" && <p className="border border-fg p-3.5 text-[13.5px]"><b className="font-semibold">Removed by an organiser.</b> {w.removed_reason ? `Reason: ${w.removed_reason}. ` : ""}See the <Link href="/rules" className="a-link">rules</Link>.</p>}
        {w.description && <p className="max-w-[34em] whitespace-pre-wrap break-words text-[17px] leading-relaxed">{w.description}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Who id={w.user_id} name={w.user_name} house={w.user_house} gradYear={w.user_grad_year} avatar={w.user_avatar} />
          <span className="text-[13.5px] text-muted">Posted {timeAgo(w.created_at)}</span>
        </div>
      </header>

      {mine ? (
        <div className="card flex flex-wrap gap-2 p-5">
          {!hidden && (
            <form action={setWantStatus}><input type="hidden" name="id" value={w.id} /><input type="hidden" name="status" value={w.status === "open" ? "fulfilled" : "open"} />
              <button className="btn-primary">{w.status === "open" ? "Mark as found" : "Reopen"}</button></form>
          )}
          <form action={deleteWant}><input type="hidden" name="id" value={w.id} /><button className="btn-ghost">Delete</button></form>
          <Link href="/listings/new" className="btn-ghost sm:ml-auto">List something</Link>
        </div>
      ) : !hidden && (
        <div className="card grid gap-3 p-5 sm:p-6">
          <h2 className="text-[22px]">Got one? Tell {first}.</h2>
          <MessageForm wantId={w.id} placeholder="Hey, I have one of these. It's…" buttonLabel={`Message ${first}`} />
        </div>
      )}

      {maybe.length > 0 && (
        <section className="grid gap-5">
          <div className="reveal grid gap-1"><p className="eyebrow">Already on the shelves</p><h2>Listings that might fit</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{maybe.map((l, i) => <div key={l.id} className="reveal" style={{ ["--i" as string]: i }}><ListingCard l={l} /></div>)}</div>
        </section>
      )}

      {!mine && !hidden && <ReportForm type="want" id={w.id} reasons={REPORT_REASONS} what="this post" />}
    </div>
  );
}
