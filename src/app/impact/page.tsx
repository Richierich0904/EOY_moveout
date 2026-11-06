import { impactStats } from "@/lib/listings";
import { categoryLabel, SCHOOL_NAME } from "@/lib/config";
import { getDb } from "@/lib/db";
import { houseLeaderboard } from "@/lib/game";
import { PageIntro } from "@/components/PageIntro";

const kg = (n: number) => (n < 10 ? n.toFixed(1) : String(Math.round(n)));
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function ImpactPage() {
  const s = impactStats();
  const members = (getDb().prepare("SELECT COUNT(*) c FROM users WHERE verified = 1").get() as { c: number }).c;
  const live = (getDb().prepare("SELECT COUNT(*) c FROM listings WHERE status = 'available'").get() as { c: number }).c;
  const max = Math.max(1, ...s.byCategory.map((c) => c.kg));
  const houses = houseLeaderboard();
  const hmax = Math.max(1, ...houses.map((h) => h.rehomed));
  const stats: [string, string | number][] = [["Items rehomed", s.items], ["Kept out of landfill", `~${kg(s.kg)} kg`], ["Given away free", s.freeItems], ["Kept in students' pockets", `$${Math.round(s.dollars)}`]];
  return (
    <div className="mx-auto grid max-w-4xl gap-16 sm:gap-20">
      <PageIntro eyebrow={`Impact at ${SCHOOL_NAME}`} title="Every swap is one less thing in the skip." sub="What has changed hands so far, and which house is doing the most of it." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {stats.map(([k, v], i) => (
          <div key={k} className="card reveal grid gap-1 p-5" style={{ ["--i" as string]: i }}>
            <span className="display text-[clamp(2rem,4vw,2.8rem)] leading-none tabular-nums">{v}</span>
            <span className="text-[13.5px] text-muted">{k}</span>
          </div>
        ))}
      </div>

      <section className="grid gap-6">
        <div className="intro reveal"><p className="eyebrow">House cup</p><h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Items rehomed, by house</h2><p className="sub">Bragging rights only, for now.</p></div>
        <ol className="card reveal grid gap-5 p-6 sm:p-8">
          {houses.map((h, i) => (
            <li key={h.house} className="grid gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-baseline gap-3"><span className="display w-6 text-[22px] text-accent tabular-nums">{i + 1}</span><span className="display text-[21px]">{h.house}</span><span className="text-[13px] text-muted">{plural(h.members, "member")}</span></span>
                <span className="text-[14px] text-muted tabular-nums">{plural(h.rehomed, "item")} · {h.given} free · ~{kg(h.kg)} kg</span>
              </div>
              <div className="ml-9 h-2 rounded-full bg-line"><div className={`h-2 rounded-full ${i === 0 ? "bg-accent" : "bg-moss"}`} style={{ width: `${(h.rehomed / hmax) * 100}%` }} /></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6">
        <div className="intro reveal"><p className="eyebrow">By category</p><h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">What&apos;s moving</h2></div>
        <div className="card reveal p-6 sm:p-8">
          {s.byCategory.length === 0 ? <p className="text-center text-muted">Nothing rehomed yet. Mark a listing as gone and it shows up here.</p> : (
            <ul className="grid gap-4">
              {s.byCategory.map((c) => (
                <li key={c.category} className="grid gap-2">
                  <div className="flex justify-between gap-2 text-[15px]"><span className="font-semibold">{categoryLabel(c.category)}</span><span className="text-muted tabular-nums">{plural(c.items, "item")} · ~{kg(c.kg)} kg</span></div>
                  <div className="h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-moss" style={{ width: `${(c.kg / max) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <p className="text-center text-[13.5px] text-muted">{members} verified students · {live} items available right now. Weights are rough per-category estimates, meant for a sense of scale rather than an audit.</p>
    </div>
  );
}
