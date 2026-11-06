import type { BADGES } from "@/lib/config";

export function Badges({ list }: { list: readonly (typeof BADGES)[number][] }) {
  if (list.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {list.map((b) => <li key={b.slug} title={b.desc} className="inline-flex items-center gap-1 rounded-full bg-fg/[.06] px-2.5 py-1 text-[12.5px] font-medium"><span>{b.emoji}</span>{b.label}</li>)}
    </ul>
  );
}
