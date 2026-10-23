"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter(); const sp = useSearchParams();
  return (
    <label className="inline-flex items-center gap-1 rounded-md border border-line bg-[#f0f2f2] px-2 py-1 text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)]">
      <span className="text-muted">Sort by:</span>
      <select value={value} onChange={(e) => { const p = new URLSearchParams(sp.toString()); p.set("sort", e.target.value); router.push("/?" + p.toString()); }} className="bg-transparent font-medium outline-none">
        <option value="new">Newest arrivals</option>
        <option value="cheap">Price: Low to High</option>
        <option value="pricey">Price: High to Low</option>
      </select>
    </label>
  );
}
