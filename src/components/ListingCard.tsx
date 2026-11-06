import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { timeAgo } from "@/lib/format";
import { Price } from "./Price";

export function Thumb({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (src) return <img src={`/uploads/${src}`} alt={alt} loading="lazy" className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04] ${className}`} />;
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-deep to-bg ${className}`}>
      <span className="display text-[42px] text-muted/50">{alt.slice(0, 1)}</span>
    </div>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  const gone = l.status !== "available";
  return (
    <Link href={`/listings/${l.id}`} className="card lift group flex flex-col overflow-hidden p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-[9px] bg-bg">
        <Thumb src={l.image} alt={l.title} />
        {gone && <div className="absolute inset-0 flex items-center justify-center bg-bg/70 text-[13px] font-semibold uppercase tracking-[.14em] text-muted backdrop-blur-[2px]">{l.status === "sold" ? "Rehomed" : "Reserved"}</div>}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {l.handoff === "fall" && <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold text-fg backdrop-blur">Fall handoff</span>}
          {l.accepts_credits === 1 && l.price_cents > 0 && <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold text-moss-deep backdrop-blur">⭐ Credits</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-1 pb-1 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="line-clamp-1 text-[15px] font-semibold">{l.title}</span>
          <Price cents={l.price_cents} size="sm" className="shrink-0" />
        </div>
        <div className="line-clamp-1 text-[13px] text-muted">{l.seller_name.split(" ")[0]} · {l.seller_house}{l.course_code ? ` · ${l.course_code}` : ""}</div>
        <div className="mt-auto line-clamp-1 pt-1 text-[12.5px] text-muted">{l.spot ?? "Pickup on campus"} · {timeAgo(l.created_at)}</div>
      </div>
    </Link>
  );
}
