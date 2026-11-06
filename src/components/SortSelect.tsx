"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter(); const sp = useSearchParams();
  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line px-3.5 py-1.5 text-[14px] font-medium transition-colors hover:border-accent">
      <span className="text-muted">Sort</span>
      <select value={value} aria-label="Sort listings"
        onChange={(e) => { const p = new URLSearchParams(sp.toString()); p.set("sort", e.target.value); router.push("/?" + p.toString(), { scroll: false }); }}
        className="cursor-pointer appearance-none bg-transparent pr-4 outline-none">
        <option value="new">Newest</option>
        <option value="cheap">Price, low to high</option>
        <option value="pricey">Price, high to low</option>
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 text-[10px] text-muted">▼</span>
    </label>
  );
}
