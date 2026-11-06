"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icons";

type Pic = { id: number; title: string; image: string };

/** Two big photos side by side, stepped through with square arrows, like the reference's "New collection" hero. */
export function HeroPair({ pics }: { pics: Pic[] }) {
  const [i, setI] = useState(0);
  const n = pics.length;
  const shown = n === 0 ? [] : [pics[i % n], pics[(i + 1) % n]].slice(0, Math.min(2, n));
  const btn = "flex h-8 w-8 items-center justify-center border border-line bg-card text-fg transition hover:border-fg disabled:opacity-35";
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {shown.length === 0 && [0, 1].map((k) => <div key={k} className="card aspect-[4/5]" />)}
        {shown.map((p, k) => (
          <Link key={`${p.id}-${k}`} href={`/listings/${p.id}`} className="group card relative block aspect-[4/5] overflow-hidden">
            <img key={p.image} src={`/uploads/${p.image}`} alt={p.title} className="h-full w-full animate-[rise_.6s_cubic-bezier(.16,1,.3,1)_both] object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <span className="absolute bottom-0 left-0 right-0 truncate bg-card/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[.08em] backdrop-blur">{p.title}</span>
          </Link>
        ))}
      </div>
      {n > 2 && (
        <div className="flex gap-2">
          <button type="button" aria-label="Previous photos" className={btn} onClick={() => setI((x) => (x - 1 + n) % n)}><Icon name="left" size={15} /></button>
          <button type="button" aria-label="Next photos" className={btn} onClick={() => setI((x) => (x + 1) % n)}><Icon name="right" size={15} /></button>
          <span className="self-center pl-2 text-[11px] uppercase tracking-[.08em] text-muted tabular-nums">{(i % n) + 1} / {n}</span>
        </div>
      )}
    </div>
  );
}
