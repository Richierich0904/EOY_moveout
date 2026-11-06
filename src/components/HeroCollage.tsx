"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Pic = { id: number; title: string; image: string };

/** Three listing photos in offset cards that drift at different depths as you scroll. */
export function HeroCollage({ pics }: { pics: Pic[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...(ref.current?.querySelectorAll<HTMLElement>("[data-depth]") ?? [])];
    let ticking = false;
    const apply = () => {
      const y = Math.min(window.scrollY, 700);
      els.forEach((el) => { el.style.transform = `translate3d(0, ${(y * parseFloat(el.dataset.depth!)).toFixed(1)}px, 0)`; });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const slots = [
    { cls: "left-1/2 top-0 w-[54%] -translate-x-[38%] sm:w-[40%] aspect-[4/5]", depth: ".05" },
    { cls: "left-[2%] top-[22%] w-[40%] sm:left-[8%] sm:w-[27%] aspect-square", depth: ".14" },
    { cls: "right-[2%] top-[38%] w-[38%] sm:right-[9%] sm:w-[24%] aspect-square", depth: ".1" },
  ];
  return (
    <div ref={ref} className="relative mx-auto mt-10 h-[min(96vw,560px)] max-w-5xl sm:mt-14 sm:h-[min(52vw,560px)]" aria-label="Recently listed">
      {slots.map((s, i) => {
        const p = pics[i];
        return (
          <div key={i} data-depth={s.depth} className={`absolute ${s.cls}`}>
            {p ? (
              <Link href={`/listings/${p.id}`} className="card lift group block h-full overflow-hidden p-2.5">
                <div className="h-full overflow-hidden rounded-[9px] bg-bg">
                  <img src={`/uploads/${p.image}`} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <span className="absolute bottom-5 left-5 max-w-[calc(100%-2.5rem)] truncate rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-muted backdrop-blur">{p.title}</span>
              </Link>
            ) : (
              <div className="card h-full p-2.5"><div className="h-full rounded-[9px] bg-gradient-to-br from-bg-deep to-bg" /></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
