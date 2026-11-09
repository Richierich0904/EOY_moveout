"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter(); const sp = useSearchParams();
  return (
    <label className="relative inline-flex items-center gap-1.5 pr-4 text-[12px] uppercase tracking-[.08em]">
      <span className="text-muted">Sort</span>
      <select value={value} aria-label="Sort listings"
        onChange={(e) => { const p = new URLSearchParams(sp.toString()); p.set("sort", e.target.value); router.push("/?" + p.toString() + "#browse", { scroll: false }); }}
        className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold uppercase outline-none">
        <option value="new">Newest</option>
        <option value="cheap">Less to more</option>
        <option value="pricey">More to less</option>
      </select>
      <span aria-hidden className="pointer-events-none absolute right-0 text-[9px]">▼</span>
    </label>
  );
}
