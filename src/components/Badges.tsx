import type { BADGES } from "@/lib/config";

export function Badges({ list }: { list: readonly (typeof BADGES)[number][] }) {
  if (list.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {list.map((b) => <li key={b.slug} title={b.desc} className="inline-flex items-center gap-1 border border-line px-2 py-1 text-[11px] font-medium uppercase tracking-[.06em]"><span>{b.emoji}</span>{b.label}</li>)}
    </ul>
  );
}
