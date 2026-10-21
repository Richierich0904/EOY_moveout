import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { money, timeAgo } from "@/lib/format";

export function ListingCard({ l }: { l: Listing }) {
  return (
    <Link href={`/listings/${l.id}`} className="group block overflow-hidden rounded-xl border border-line bg-card transition hover:shadow-md">
      <div className="relative aspect-square bg-line">
        {l.image ? (
          <img src={`/uploads/${l.image}`} alt={l.title} className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted">📦</div>
        )}
        {l.status !== "available" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold uppercase tracking-wide text-white">
            {l.status === "sold" ? "Gone" : "Reserved"}
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {l.price_cents === 0 && <span className="rounded-full bg-free px-2 py-0.5 text-xs font-bold text-white">FREE</span>}
          {l.handoff === "fall" && <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">Fall handoff</span>}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{l.title}</span>
          <span className={`shrink-0 font-bold ${l.price_cents === 0 ? "text-free" : ""}`}>{money(l.price_cents)}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted">
          {l.course_code ? `${l.course_code} · ` : ""}{l.seller_house} · {timeAgo(l.created_at)}
        </div>
      </div>
    </Link>
  );
}
