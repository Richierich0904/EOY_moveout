import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { timeAgo } from "@/lib/format";
import { Price } from "./Price";

export function ListingCard({ l }: { l: Listing }) {
  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-[0_2px_8px_rgba(0,0,0,.15)]">
      <Link href={`/listings/${l.id}`} className="relative block aspect-square bg-[#f7f7f7]">
        {l.image ? (
          <img src={`/uploads/${l.image}`} alt={l.title} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-line">📦</div>
        )}
        {l.status !== "available" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[15px] font-bold uppercase tracking-wide text-muted">
            {l.status === "sold" ? "Gone" : "Reserved"}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/listings/${l.id}`} className="a-link line-clamp-2 text-[15px] leading-5 text-fg hover:text-link-hover">{l.title}</Link>
        <div className="text-[12px] text-muted">{l.seller_name} · {l.seller_house}{l.course_code ? ` · ${l.course_code}` : ""}</div>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <Price cents={l.price_cents} size="md" />
          {l.handoff === "fall" && <span className="rounded-sm bg-subheader px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Fall handoff</span>}
          {l.accepts_credits === 1 && l.price_cents > 0 && <span className="rounded-sm border border-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">⭐ Credits ok</span>}
        </div>
        <div className="text-[12px]"><span className="font-bold">FREE pickup</span> {l.spot ? `at ${l.spot}` : "on campus"} · <span className="text-muted">{timeAgo(l.created_at)}</span></div>
      </div>
    </div>
  );
}
