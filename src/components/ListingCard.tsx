import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { categoryLabel } from "@/lib/config";
import { Price } from "./Price";

export function Thumb({ src, alt, label, className = "" }: { src: string | null; alt: string; label?: string; className?: string }) {
  if (src) return <img src={`/uploads/${src}`} alt={alt} loading="lazy" className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03] ${className}`} />;
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1 ${className}`}>
      <span className="display text-[12px] uppercase tracking-[.1em] text-muted">{label ?? alt}</span>
      <span className="text-[10.5px] uppercase tracking-[.08em] text-muted/60">No photo yet</span>
    </div>
  );
}

/** Product tile after the reference: the photo in a thin-bordered tile, then a small grey line and name + price below. */
export function ListingCard({ l }: { l: Listing }) {
  const gone = l.status !== "available";
  return (
    <Link href={`/listings/${l.id}`} data-listing className="group grid min-w-0 grid-cols-1 gap-2.5">
      <div className="card lift relative aspect-[4/5] overflow-hidden">
        <Thumb src={l.image} alt={l.title} label={categoryLabel(l.category)} />
        {gone && <div className="absolute inset-0 flex items-center justify-center bg-bg/95 text-[11px] font-semibold uppercase tracking-[.14em] text-fg">{l.status === "sold" ? "Rehomed" : "Reserved"}</div>}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {l.handoff === "fall" && <span className="bg-card px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.08em] text-fg ring-1 ring-line">Fall handoff</span>}
          {l.accepts_credits === 1 && l.price_cents > 0 && <span className="bg-card px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.08em] text-accent ring-1 ring-line">⭐ Credits</span>}
        </div>
        <span aria-hidden className="absolute bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center text-[16px] text-muted opacity-60 transition group-hover:opacity-100">+</span>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-0.5 px-0.5">
        <span className="truncate text-[11px] text-muted">{categoryLabel(l.category)} · {l.condition}{l.course_code ? ` · ${l.course_code}` : ""}</span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate text-[13.5px] font-medium">{l.title}</span>
          <Price cents={l.price_cents} size="sm" className="shrink-0" />
        </span>
        <span className="truncate text-[11px] text-muted">{l.seller_name.split(" ")[0]} · {l.seller_house}</span>
      </div>
    </Link>
  );
}
