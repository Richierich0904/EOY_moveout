import { impactStats } from "@/lib/listings";
import { categoryLabel, SCHOOL_NAME } from "@/lib/config";
import { getDb } from "@/lib/db";
import { houseLeaderboard } from "@/lib/game";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Impact" };

const kg = (n: number) => (n < 10 ? n.toFixed(1) : String(Math.round(n)));
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function ImpactPage() {
  const s = impactStats();
  const members = (getDb().prepare("SELECT COUNT(*) c FROM users WHERE verified = 1").get() as { c: number }).c;
  const live = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE status = 'available'").get() as { c: number }).c;
  const max = Math.max(1, ...s.byCategory.map((c) => c.kg));
  const dorms = houseLeaderboard();
  const dmax = Math.max(1, ...dorms.map((h) => h.rehomed));
  const leaders = dorms.filter((d) => d.rank === 1 && d.rehomed > 0);
  const stats: [string, string, string][] = [
    ["Items rehomed", String(s.items), ""],
    ["Kept out of landfill", `~${kg(s.kg)}`, "kg"],
    ["Given away free", String(s.freeItems), ""],
    ["Kept in students' pockets", `$${Math.round(s.dollars)}`, ""],
  ];
  const lead =
    leaders.length === 0 ? "Nobody has rehomed anything yet. The first dorm to do it takes the lead."
    : leaders.length === 1 ? `${leaders[0].house} is in the lead.`
    : `${leaders.map((l) => l.house).join(", ")} are tied for the lead.`;

  return (
    <div className="grid grid-cols-1 gap-16 sm:gap-20">
      <PageIntro eyebrow={`Impact at ${SCHOOL_NAME}`} title="Every swap is one less thing in the skip." sub="What has changed hands so far, and which dorm is doing the most of it." />

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {stats.map(([label, value, unit], i) => (
          <div key={label} className="card reveal grid content-between gap-6 p-5" style={{ ["--i" as string]: i }}>
            <span className="eyebrow">{label}</span>
            <span className="display whitespace-nowrap text-[clamp(2rem,3.6vw,2.8rem)] leading-none tabular-nums">
              {value}{unit && <span className="ml-1 text-[.45em] font-semibold">{unit}</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12">
        <section className="grid content-start gap-6">
          <div className="reveal grid gap-2">
            <p className="eyebrow">Dorm cup</p>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Items rehomed,<br />by dorm</h2>
            <p className="sub">{lead}</p>
          </div>
          <ol className="card reveal grid p-2 sm:p-4">
            {dorms.map((h) => {
              const top = h.rank === 1 && h.rehomed > 0;
              return (
                <li key={h.house} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-2 border-b border-line px-3 py-4 last:border-b-0">
                  <span className={`display row-span-2 text-[20px] tabular-nums ${top ? "text-accent" : h.rehomed ? "" : "text-muted/50"}`}>{h.rehomed ? h.rank : "–"}</span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="flex items-baseline gap-2">
                      <span className="display text-[18px] uppercase">{h.house}</span>
                      <span className="text-[11.5px] text-muted">{h.members ? plural(h.members, "member") : "no members yet"}</span>
                    </span>
                    <span className="text-[12px] text-muted tabular-nums">{plural(h.rehomed, "item")} · {h.given} free · ~{kg(h.kg)} kg</span>
                  </div>
                  <div className="h-1.5 bg-line"><div className={`h-1.5 ${top ? "bg-accent" : "bg-fg"}`} style={{ width: `${(h.rehomed / dmax) * 100}%` }} /></div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid content-start gap-6">
          <div className="reveal grid gap-2">
            <p className="eyebrow">By category</p>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">What&apos;s<br />moving</h2>
            <p className="sub">Weight is a rough estimate per category, for a sense of scale.</p>
          </div>
          <div className="card reveal p-2 sm:p-4">
            {s.byCategory.length === 0 ? (
              <p className="p-4 text-muted">Nothing rehomed yet. Mark a listing as gone and it shows up here.</p>
            ) : (
              <ul className="grid">
                {s.byCategory.map((c) => (
                  <li key={c.category} className="grid gap-2 border-b border-line px-3 py-4 last:border-b-0">
                    <div className="flex justify-between gap-2">
                      <span className="display text-[15px] uppercase">{categoryLabel(c.category)}</span>
                      <span className="text-[12px] text-muted tabular-nums">{plural(c.items, "item")} · ~{kg(c.kg)} kg</span>
                    </div>
                    <div className="h-1.5 bg-line"><div className="h-1.5 bg-fg" style={{ width: `${(c.kg / max) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <p className="text-[12px] uppercase tracking-[.08em] text-muted">{plural(members, "verified student")} · {live} items available right now</p>
    </div>
  );
}
