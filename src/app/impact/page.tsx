import { impactStats } from "@/lib/listings";
import { categoryLabel, SCHOOL_NAME } from "@/lib/config";
import { getDb } from "@/lib/db";

const kg = (n: number) => (n < 10 ? n.toFixed(1) : String(Math.round(n)));
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function ImpactPage() {
  const s = impactStats();
  const members = (getDb().prepare("SELECT COUNT(*) c FROM users WHERE verified = 1").get() as { c: number }).c;
  const live = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE status = 'available'").get() as { c: number }).c;
  const max = Math.max(1, ...s.byCategory.map((c) => c.kg));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold">Impact at {SCHOOL_NAME}</h1><p className="text-sm text-muted">Every item that changes hands here is one that didn&apos;t go in a skip at the end of the year.</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Items rehomed", s.items], ["Kept out of landfill", `~${kg(s.kg)} kg`], ["Given away free", s.freeItems], ["Kept in students' pockets", `$${Math.round(s.dollars)}`]].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-line bg-card p-4"><div className="text-2xl font-black">{v}</div><div className="text-xs text-muted">{k}</div></div>
        ))}
      </div>
      <div className="rounded-xl border border-line bg-card p-4">
        <h2 className="mb-3 font-bold">By category</h2>
        {s.byCategory.length === 0 ? <p className="text-sm text-muted">Nothing rehomed yet. Mark a listing as “gone” and it shows up here.</p> : (
          <ul className="space-y-2">
            {s.byCategory.map((c) => (
              <li key={c.category} className="text-sm">
                <div className="flex justify-between"><span>{categoryLabel(c.category)}</span><span className="text-muted">{plural(c.items, "item")} · ~{kg(c.kg)} kg</span></div>
                <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-accent" style={{ width: `${(c.kg / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-sm text-muted">{members} verified students · {live} items available right now. Weights are rough per-category estimates, meant for a sense of scale rather than an audit.</p>
    </div>
  );
}
