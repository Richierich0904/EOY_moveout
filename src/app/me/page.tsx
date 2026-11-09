import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { searchListings } from "@/lib/listings";
import { listWants } from "@/lib/social";
import { ListingCard } from "@/components/ListingCard";
import { money, timeAgo, classLabel } from "@/lib/format";
import { logout } from "@/actions/auth";
import { activeBoost, creditBalance, creditHistory } from "@/lib/game";
import { myBlocks } from "@/lib/moderation";
import { unblockUser } from "@/actions/moderation";
import { daysLeft, fmtDate } from "@/lib/time";
import { awardsFor, badgeProgress, myRanks, personalTotals, weeklyPoints, type MyRank } from "@/lib/progress";
import { BOOST_COST, BOOST_DAYS, CREDIT_PER_HANDOFF, POINTS_GIVEAWAY, POINTS_SALE, RANK_PRIZES } from "@/lib/config";
import { AvatarForm } from "@/components/AvatarForm";
import { WeeklyChart } from "@/components/WeeklyChart";

export const metadata = { title: "My account" };

const PERIOD_NAME = { week: "This week", month: "This month", year: "This school year" } as const;
const PLACE = ["1st", "2nd", "3rd"];

function prizeLine(r: MyRank) {
  const prizes = RANK_PRIZES[r.window.period];
  if (prizes.length === 1) return `#1 wins ⭐${prizes[0] / 100}`;
  return `Top ${prizes.length} win ⭐${prizes.map((p) => p / 100).join(" / ")}`;
}

function RankCard({ r, hidden }: { r: MyRank; hidden: boolean }) {
  const top = r.rank === 1;
  const nudge = hidden ? "You're hidden from the rankings. Your points still count for your dorm."
    : top ? (r.of > 1 ? "You're in front. Nice work." : "You're the first one on the board.")
    : r.gap ? `${r.gap} more point${r.gap === 1 ? "" : "s"} to move up a place` : "Rehome one thing to get on the board.";
  return (
    <div className={`card reveal grid content-between gap-5 p-5 ${top ? "border-accent" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="eyebrow">{PERIOD_NAME[r.window.period]}</span>
        <span className="text-[11px] text-muted">{daysLeft(r.window.end)}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className={`display text-[clamp(2.6rem,5vw,3.6rem)] leading-none tabular-nums ${top ? "text-accent" : ""}`}>{r.rank ? `#${r.rank}` : "–"}</span>
        <span className="pb-1 text-right text-[12px] leading-tight text-muted"><b className="block text-[18px] font-bold text-fg tabular-nums">{r.points} pts</b>{r.rank ? `of ${r.of} ranked` : hidden ? "hidden" : "not ranked yet"}</span>
      </div>
      <div className="grid gap-1 border-t border-line pt-3 text-[12.5px]">
        <span>{nudge}</span>
        {!hidden && <span className="text-muted">{prizeLine(r)} credits</span>}
      </div>
    </div>
  );
}

export default async function MePage({ searchParams }: { searchParams: Promise<{ listed?: string; password?: string }> }) {
  const user = await requireViewer();
  const { listed, password } = await searchParams;
  const listings = searchListings({ userId: user.id, status: "all" });
  const wants = listWants({ userId: user.id, status: "all" });
  const credits = creditBalance(user.id);
  const history = creditHistory(user.id);
  const awaiting = listings.filter((l) => l.status === "sold" && l.buyer_id && !l.received_at);
  const ranks = myRanks(user.id);
  const totals = personalTotals(user.id);
  const bars = weeklyPoints(user.id, 12);
  const badges = badgeProgress(user.id, totals.streak);
  const boost = activeBoost(user.id);
  const blocks = myBlocks(user.id);
  const hidden = user.hide_from_rankings === 1;
  const earnedCount = badges.filter((b) => b.earned).length;
  const awards = awardsFor(user.id);
  const kg = totals.kg < 10 ? totals.kg.toFixed(1) : String(Math.round(totals.kg));
  const stats: [string, string][] = [
    ["Points", String(totals.points)], ["Rehomed", String(totals.handoffs)], ["Kept out of the skip", `~${kg} kg`],
    ["Earned", money(totals.earned)], ["Credits", `⭐ ${Math.max(0, credits) / 100}`],
  ];

  return (
    <div className="grid gap-16 sm:gap-24">
      <header className="rise grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="grid gap-4">
            <AvatarForm name={user.name} avatar={user.avatar} />
            <div className="grid gap-2">
              <p className="eyebrow">{user.house} · {classLabel(user.grad_year)}</p>
              <h1 className="text-[clamp(2.4rem,5vw,3.6rem)]">{user.name}</h1>
            </div>
          </div>
          {totals.streak > 0 && (
            <div className="card px-5 py-4 text-right">
              <span className="display block text-[34px] leading-none">{totals.streak} wk{totals.streak === 1 ? "" : "s"}</span>
              <span className="text-[11.5px] uppercase tracking-[.08em] text-muted">Streak, rehoming every week</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {stats.map(([k, v]) => (
            <div key={k} className="card grid gap-1 p-4"><span className="display whitespace-nowrap text-[26px] leading-none tabular-nums">{v}</span><span className="text-[12px] text-muted">{k}</span></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/listings/new" className="btn-primary">Sell something</Link>
          <Link href="/listings/new?mode=bulk" className="btn-ghost">Clear out my room</Link>
          <Link href="/alerts" className="btn-ghost">Alerts &amp; saved searches</Link>
          <Link href="/messages" className="btn-ghost">Messages</Link>
          <Link href="/wanted" className="btn-ghost sm:hidden">Wanted</Link>
          <Link href="/me/settings" className="btn-ghost">Settings</Link>
          {user.is_admin && <Link href="/admin" className="btn-ghost">Organisers</Link>}
          <form action={logout} className="sm:ml-auto"><button className="btn-ghost">Sign out</button></form>
        </div>
      </header>

      {(listed || password || awaiting.length > 0) && (
        <div className="-mt-8 grid gap-3">
          {password && <p className="bg-bg-deep p-4 text-[15px]">Your password has been changed and you&apos;ve been signed out everywhere else.</p>}
          {listed && <p className="bg-bg-deep p-4 text-[15px]">Posted {Number(listed) || "your"} items. They are on your shelf below.</p>}
          {awaiting.length > 0 && <p className="card p-4 text-[15px]">{awaiting.length} handoff{awaiting.length === 1 ? " is" : "s are"} waiting for the other person to confirm. Points arrive once they do.</p>}
        </div>
      )}

      <section className="grid gap-6">
        <div className="reveal flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-2">
            <p className="eyebrow">Your rankings</p>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Where you stand</h2>
            <p className="sub">Every confirmed giveaway is {POINTS_GIVEAWAY} points, every confirmed sale {POINTS_SALE}. Prizes are paid in credits when each period ends, and a tie shares the prize.</p>
          </div>
          <Link href="/rankings" className="more">Full rankings</Link>
        </div>
        <div className="grid gap-3 sm:gap-5 lg:grid-cols-3">{ranks.map((r) => <RankCard key={r.window.period} r={r} hidden={hidden} />)}</div>
      </section>

      <section className="grid gap-6">
        <div className="reveal grid gap-2">
          <p className="eyebrow">Your progress</p>
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Last 12 weeks</h2>
          <p className="sub">{totals.points === 0 ? "Your first confirmed handoff starts the chart." : `${totals.given} given away, ${totals.sold} sold, ${totals.points} points in total.`}</p>
        </div>
        <div className="card reveal p-4 sm:p-6"><WeeklyChart bars={bars} /></div>
      </section>

      <section className="grid gap-6">
        <div className="reveal grid gap-2">
          <p className="eyebrow">Achievements · {earnedCount} of {badges.length}</p>
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Badges</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b, i) => (
            <div key={b.slug} className={`card reveal grid content-between gap-3 p-4 ${b.earned ? "" : "bg-transparent"}`} style={{ ["--i" as string]: i % 4 }}>
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[26px] leading-none ${b.earned ? "" : "opacity-30 grayscale"}`} aria-hidden>{b.emoji}</span>
                <span className={`text-[10.5px] font-semibold uppercase tracking-[.08em] ${b.earned ? "text-fg" : "text-muted"}`}>{b.earned ? "Earned" : `${b.have} / ${b.need}`}</span>
              </div>
              <div className="grid gap-0.5">
                <span className={`display text-[14px] uppercase ${b.earned ? "" : "text-muted"}`}>{b.label}</span>
                <span className="text-[12px] text-muted">{b.desc}</span>
              </div>
              {!b.earned && <div className="h-1 bg-line"><div className="h-1 bg-fg" style={{ width: `${(b.have / b.need) * 100}%` }} /></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6">
        <div className="reveal grid gap-2">
          <p className="eyebrow">Trophy shelf</p>
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Prizes won</h2>
        </div>
        {awards.length === 0 ? (
          <p className="card reveal p-6 text-muted">No prizes yet. Finish a week at #1, or a month or school year in the top 3, and it lands here with credits.</p>
        ) : (
          <ul className="card reveal divide-y divide-line">
            {awards.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                <span className="flex items-baseline gap-3"><span className="display text-[20px] text-accent">{PLACE[a.place - 1] ?? `#${a.place}`}</span><span className="font-semibold">{a.label}</span><span className="text-[12px] text-muted">{a.points} pts</span></span>
                <span className="text-[13px] font-semibold tabular-nums">{a.credit_cents ? `+⭐ ${a.credit_cents / 100}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-5">
        <div className="reveal flex items-end justify-between gap-3"><div className="grid gap-1"><p className="eyebrow">Your shelf</p><h2>My listings</h2></div><Link href="/listings/new" className="more">List another</Link></div>
        {listings.length === 0 ? <p className="card p-8 text-muted">Nothing listed yet.</p> : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{listings.map((l, i) => <div key={l.id} className="reveal min-w-0" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}</div>
        )}
      </section>

      <section id="credits" className="grid scroll-mt-24 gap-5">
        <div className="reveal grid gap-2">
          <p className="eyebrow">Balance ⭐ {Math.max(0, credits) / 100}</p>
          <h2>Credits</h2>
          <p className="sub">Credits put one of your listings at the top of the shelves. A boost costs ⭐ {BOOST_COST / 100} and lasts {BOOST_DAYS} days. Open any of your available listings and press Boost.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card reveal grid content-start gap-2 p-5 text-[13.5px]">
            <p className="eyebrow">How you earn them</p>
            <ul className="grid gap-1.5">
              <li>⭐ {CREDIT_PER_HANDOFF / 100} for every handoff the other person confirms</li>
              <li>Ranking prizes at the end of each week, month and school year</li>
              <li>Prizes in the giveaway draw</li>
            </ul>
          </div>
          <div className="card reveal grid content-start gap-2 p-5 text-[13.5px]">
            <p className="eyebrow">Good to know</p>
            <ul className="grid gap-1.5">
              <li>Credits can&apos;t be bought, sent to anyone or turned into money.</li>
              <li>One boost at a time. {boost ? <>Right now you&apos;re boosting <Link href={`/listings/${boost.id}`} className="a-link">{boost.title}</Link> until {fmtDate(boost.boosted_until, { weekday: "long", month: "short", day: "numeric" })}.</> : "Nothing of yours is boosted right now."}</li>
            </ul>
          </div>
        </div>
        {history.length > 0 && (
          <ul className="card reveal divide-y divide-line">
            {history.map((h) => (
              <li key={h.id} className="flex items-baseline justify-between gap-3 px-5 py-3.5 text-[14px]">
                <span>{h.reason}</span>
                <span className="shrink-0 text-right"><span className="font-semibold tabular-nums">{h.delta > 0 ? "+" : ""}{h.delta / 100}</span> <span className="text-[12px] text-muted">· {timeAgo(h.created_at)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-5">
        <div className="reveal flex items-end justify-between gap-3"><div className="grid gap-1"><p className="eyebrow">What you&apos;re after</p><h2>My wanted posts</h2></div><Link href="/wanted/new" className="more">New wanted post</Link></div>
        {wants.length === 0 ? <p className="card p-8 text-muted">None yet.</p> : (
          <ul className="card reveal divide-y divide-line">
            {wants.map((w) => (
              <li key={w.id}><Link href={`/wanted/${w.id}`} className="flex items-baseline justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bg">
                <span className="font-semibold">{w.title}{w.status !== "open" && <span className="ml-2 text-[12px] font-medium text-muted">{w.status === "fulfilled" ? "Found" : w.status === "review" ? "Being checked" : "Removed"}</span>}</span>
                <span className="text-[13px] text-muted">{w.max_price_cents !== null ? `up to ${money(w.max_price_cents)}` : "any price"}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>

      {blocks.length > 0 && (
        <section className="grid gap-4">
          <div className="reveal grid gap-1"><p className="eyebrow">Only you can see this</p><h2>Blocked students</h2></div>
          <ul className="card reveal divide-y divide-line">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
                <span>{b.name}</span>
                <form action={unblockUser}><input type="hidden" name="user_id" value={b.id} /><input type="hidden" name="back" value="/me" /><button className="chip">Unblock</button></form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
