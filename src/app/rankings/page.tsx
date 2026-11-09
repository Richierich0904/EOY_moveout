import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PERIODS, periodWindow, ranking, type Period } from "@/lib/progress";
import { POINTS_GIVEAWAY, POINTS_SALE, RANK_PRIZES } from "@/lib/config";
import { getDb } from "@/lib/db";
import { PageIntro } from "@/components/PageIntro";
import { Face } from "@/components/Avatar";

export const metadata = { title: "Rankings" };

const TAB: Record<Period, string> = { week: "This week", month: "This month", year: "School year" };

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: raw } = await searchParams;
  const period: Period = PERIODS.includes(raw as Period) ? (raw as Period) : "week";
  const user = await getCurrentUser();
  const w = periodWindow(period);
  const list = ranking(w);
  const top = list.slice(0, 20);
  const me = user ? list.find((r) => r.user_id === user.id) : undefined;
  const prizes = RANK_PRIZES[period];
  const last = periodWindow(period, 1);
  const lastWinners = getDb().prepare(
    "SELECT a.place, a.points, u.name, u.avatar FROM awards a JOIN users u ON u.id = a.user_id WHERE a.period = ? AND a.period_key = ? ORDER BY a.place, u.name")
    .all(period, last.key) as { place: number; points: number; name: string; avatar: string | null }[];
  const days = Math.max(0, Math.ceil((w.end.getTime() - Date.now()) / 86400_000));

  const row = (r: (typeof list)[number], highlight: boolean) => {
    const prize = prizes[r.rank - 1];
    return (
      <li key={r.user_id} className={`grid grid-cols-[2.5rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5 ${highlight ? "bg-bg-deep" : ""}`}>
        <span className={`display text-[20px] tabular-nums ${r.rank === 1 ? "text-accent" : ""}`}>{r.rank}</span>
        <Face name={r.name} avatar={r.avatar} size={36} />
        <Link href={`/u/${r.user_id}`} className="min-w-0">
          <span className="block truncate font-semibold">{r.name}{highlight && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[.08em] text-muted">You</span>}</span>
          <span className="block truncate text-[12px] text-muted">{r.house} · {r.items} handoff{r.items === 1 ? "" : "s"} · {r.given} free</span>
        </Link>
        <span className="text-right">
          <span className="display block text-[18px] tabular-nums">{r.points}</span>
          {prize ? <span className="block text-[10.5px] font-semibold uppercase tracking-[.06em] text-accent">⭐ {prize / 100}</span> : <span className="block text-[10.5px] uppercase tracking-[.06em] text-muted">pts</span>}
        </span>
      </li>
    );
  };

  return (
    <div className="grid gap-12">
      <PageIntro eyebrow={`${w.label} · ${days <= 1 ? "ends today" : `${days} days left`}`} title="Rankings"
        sub={`${POINTS_GIVEAWAY} points for every giveaway and ${POINTS_SALE} for every sale, once the other person confirms the handoff. ${prizes.length === 1 ? `#1 wins ⭐${prizes[0] / 100} credits` : `The top ${prizes.length} win ⭐${prizes.map((p) => p / 100).join(" / ")} credits`} when the ${period === "year" ? "school year" : period} ends.`} />

      <div role="tablist" aria-label="Ranking period" className="flex w-fit gap-1 border border-line p-1">
        {PERIODS.map((p) => (
          <Link key={p} role="tab" aria-selected={p === period} href={`/rankings?period=${p}`}
            className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-[.08em] transition ${p === period ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>{TAB[p]}</Link>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        <section className="grid content-start gap-3">
          {top.length === 0 ? (
            <p className="card p-8 text-muted">Nobody is on the board yet {period === "week" ? "this week" : period === "month" ? "this month" : "this school year"}. Give something away and get the receiver to confirm it to take #1.</p>
          ) : (
            <ol className="card divide-y divide-line">
              {top.map((r) => row(r, r.user_id === user?.id))}
              {me && !top.includes(me) && row(me, true)}
            </ol>
          )}
          {user && !me && top.length > 0 && <p className="text-[13px] text-muted">You&apos;re not on the board yet. One confirmed giveaway puts you on it.</p>}
        </section>

        <aside className="grid content-start gap-4">
          <div className="card grid gap-3 p-5">
            <p className="eyebrow">Last {period === "year" ? "school year" : period}&apos;s winners</p>
            {lastWinners.length === 0 ? <p className="text-[13px] text-muted">No winners for {last.label.toLowerCase()}.</p> : (
              <ul className="grid gap-2.5">
                {lastWinners.map((x) => (
                  <li key={x.place + x.name} className="flex items-center gap-3">
                    <span className="display w-6 text-[16px] text-accent">{x.place}</span>
                    <Face name={x.name} avatar={x.avatar} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{x.name}</span>
                    <span className="text-[12px] text-muted tabular-nums">{x.points} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card grid gap-2 p-5 text-[13px]">
            <p className="eyebrow">Prizes</p>
            {PERIODS.map((p) => (
              <p key={p} className="flex justify-between gap-3"><span>{TAB[p].replace("This ", "Each ")}</span><span className="font-semibold tabular-nums">{RANK_PRIZES[p].map((c, i) => `#${i + 1} ⭐${c / 100}`).join(" · ")}</span></p>
            ))}
            <p className="pt-1 text-[12px] text-muted">Credits are paid automatically and show up on your account page.</p>
          </div>
          <Link href="/listings/new?mode=bulk" className="btn-primary">Give stuff away</Link>
        </aside>
      </div>
    </div>
  );
}
