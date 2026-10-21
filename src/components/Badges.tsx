import type { BADGES } from "@/lib/config";

export function Badges({ list }: { list: readonly (typeof BADGES)[number][] }) {
  if (list.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1">
      {list.map((b) => <li key={b.slug} title={b.desc} className="chip gap-1 text-xs"><span>{b.emoji}</span>{b.label}</li>)}
    </ul>
  );
}
