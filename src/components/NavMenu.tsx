"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";

type Item = { href: string; label: string; count?: number };

/** The hamburger: a drop-down sheet with every section and every category. Closes on navigation, Escape or an outside click. */
export function NavMenu({ sections, categories }: { sections: Item[]; categories: Item[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", key); document.addEventListener("mousedown", click);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("mousedown", click); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)} className="-ml-1.5 flex h-9 w-9 items-center justify-center text-fg transition hover:opacity-70">
        <Icon name={open ? "close" : "menu"} size={22} />
      </button>
      <div id="site-menu" hidden={!open}
        className="absolute left-0 top-[calc(100%+12px)] z-40 grid w-[min(86vw,520px)] gap-6 border border-line bg-card p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,.25)] sm:grid-cols-2">
        <div className="grid content-start gap-1">
          <p className="eyebrow mb-2">Menu</p>
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="display text-[20px] uppercase leading-tight transition hover:text-accent">{s.label}{!!s.count && <span className="count ml-1">({s.count})</span>}</Link>
          ))}
        </div>
        {categories.length > 0 && <div className="grid content-start gap-1.5">
          <p className="eyebrow mb-2">Departments</p>
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className="flex items-baseline justify-between gap-3 text-[13px] font-medium uppercase tracking-[.05em] transition hover:text-accent">
              {c.label}<span className="text-[11px] text-muted tabular-nums">{c.count ?? 0}</span>
            </Link>
          ))}
        </div>}
      </div>
    </div>
  );
}
