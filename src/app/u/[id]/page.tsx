import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { Badges } from "@/components/Badges";
import { Face } from "@/components/Avatar";
import { ReportForm } from "@/components/ReportForm";
import { awardsFor, badgesFor, myRanks, personalTotals } from "@/lib/progress";
import { REPORT_REASONS, iBlocked, isBlocked } from "@/lib/moderation";
import { blockUser, unblockUser } from "@/actions/moderation";
import { classYear } from "@/lib/format";
import { fmtDate } from "@/lib/time";
import { APP_NAME } from "@/lib/config";

export const metadata = { title: "Profile" };

const PERIOD_NAME = { week: "This week", month: "This month", year: "School year" } as const;
const PLACE = ["1st", "2nd", "3rd"];

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const u = getDb().prepare("SELECT id, name, house, grad_year, created_at, avatar, hide_from_rankings, suspended_at FROM users WHERE id = ? AND verified = 1").get(Number(id)) as
    { id: number; name: string; house: string; grad_year: number; created_at: string; avatar: string | null; hide_from_rankings: number; suspended_at: string | null } | undefined;
  if (!u) notFound();
  const mine = viewer.id === u.id;
  const blockedByMe = iBlocked(viewer.id, u.id);
  // If they blocked you, or their account is paused, there is nothing to see.
  if (!mine && !viewer.is_admin && ((isBlocked(viewer.id, u.id) && !blockedByMe) || u.suspended_at)) notFound();
  const first = u.name.split(" ")[0];
  const blockForm = !mine && (
    <form action={blockedByMe ? unblockUser : blockUser}>
      <input type="hidden" name="user_id" value={u.id} />
      <button className="text-[12px] text-muted underline-offset-2 hover:text-fg hover:underline">{blockedByMe ? `Unblock ${first}` : `Block ${first}`}</button>
    </form>
  );

  if (blockedByMe) {
    return (
      <div className="grid max-w-xl gap-6">
        <header className="rise grid gap-4">
          <Face name={u.name} size={88} />
          <h1 className="text-[clamp(2.2rem,5vw,3.2rem)]">{u.name}</h1>
          <p className="sub">You&apos;ve blocked {first}. They can&apos;t message you, and you don&apos;t see each other&apos;s listings.</p>
        </header>
        {blockForm}
      </div>
    );
  }

  const listings = searchListings({ userId: u.id });
  const totals = personalTotals(u.id);
  const ranks = u.hide_from_rankings ? [] : myRanks(u.id);
  const awards = u.hide_from_rankings ? [] : awardsFor(u.id);
  const since = fmtDate(u.created_at, { month: "long", year: "numeric" });
  return (
    <div className="grid gap-14">
      <header className="rise grid gap-4">
        <Face name={u.name} avatar={u.avatar} size={88} />
        <p className="eyebrow">{u.house} · Class of {classYear(u.grad_year)}{u.suspended_at ? " · Paused" : ""}</p>
        <h1 className="text-[clamp(2.2rem,5vw,3.2rem)]">{u.name}</h1>
        <p className="sub">{totals.handoffs} item{totals.handoffs === 1 ? "" : "s"} rehomed · {totals.points} points{totals.streak > 1 ? ` · ${totals.streak}-week streak` : ""} · on {APP_NAME} since {since}</p>
        <Badges list={badgesFor(u.id, totals.streak)} />
        {mine && <div><Link href="/me" className="btn-ghost">This is you. Go to my account</Link></div>}
      </header>

      {ranks.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          {ranks.map((r) => (
            <div key={r.window.period} className="card reveal flex items-end justify-between gap-3 p-5">
              <span className="grid gap-1"><span className="eyebrow">{PERIOD_NAME[r.window.period]}</span><span className="text-[12.5px] text-muted">{r.points} pts</span></span>
              <span className={`display text-[34px] leading-none tabular-nums ${r.rank === 1 ? "text-accent" : ""}`}>{r.rank ? `#${r.rank}` : "–"}</span>
            </div>
          ))}
        </section>
      )}

      {awards.length > 0 && (
        <section className="grid gap-4">
          <div className="reveal grid gap-1"><p className="eyebrow">Trophy shelf</p><h2>Prizes won</h2></div>
          <ul className="flex flex-wrap gap-2">
            {awards.map((a) => <li key={a.id} className="card reveal px-3.5 py-2 text-[13px]"><b className="display mr-2 text-accent">{PLACE[a.place - 1] ?? `#${a.place}`}</b>{a.label}</li>)}
          </ul>
        </section>
      )}

      <section className="grid gap-5">
        <div className="reveal grid gap-1"><p className="eyebrow">On {first}&apos;s shelf</p><h2>Available from {first}</h2></div>
        {listings.length === 0 ? <p className="card p-8 text-muted">Nothing right now.</p> : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{listings.map((l, i) => <div key={l.id} className="reveal min-w-0" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}</div>
        )}
      </section>

      {!mine && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-t border-line pt-5">
          <ReportForm type="user" id={u.id} reasons={REPORT_REASONS} what={first} />
          {blockForm}
        </div>
      )}
    </div>
  );
}
