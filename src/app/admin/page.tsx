import Link from "next/link";
import { requireAdminViewer } from "@/lib/auth";
import { currentDraw, entrants, pastDraws, prizesFor } from "@/lib/game";
import { getDb } from "@/lib/db";
import { runDrawNow } from "@/actions/game";
import { heldCount, openReportCount, recentLog } from "@/lib/moderation";
import { SCHOOL_TZ } from "@/lib/config";
import { fmtDateTime, toSchoolLocal } from "@/lib/time";
import { timeAgo } from "@/lib/format";
import { AdminForms } from "@/components/AdminForms";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Organisers" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ granted?: string }> }) {
  await requireAdminViewer();
  const { granted } = await searchParams;
  const draw = currentDraw();
  const pool = draw ? entrants(draw) : [];
  const past = pastDraws(10);
  const stats = getDb().prepare("SELECT (SELECT COUNT(*) FROM users WHERE verified=1) users, (SELECT COUNT(*) FROM listings WHERE status='available') live, (SELECT COUNT(*) FROM listings WHERE status='sold') gone, (SELECT COALESCE(SUM(delta),0) FROM credit_transactions WHERE delta>0) issued").get() as { users: number; live: number; gone: number; issued: number };
  const reports = openReportCount(), held = heldCount();
  const log = recentLog(20);

  return (
    <div className="grid max-w-3xl gap-8">
      <PageIntro eyebrow="Organisers" title="Run the swap" sub="Keep it safe first. Then draws, credits, and how the term is going." />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/reports" className={`card lift grid gap-1 p-5 ${reports + held > 0 ? "border-accent" : ""}`}>
          <span className="display text-[34px] leading-none tabular-nums">{reports + held}</span>
          <span className="font-semibold">Waiting for you</span>
          <span className="text-[13px] text-muted">{reports} report{reports === 1 ? "" : "s"} · {held} post{held === 1 ? "" : "s"} held for review. Also where you pause accounts.</span>
        </Link>
        <Link href="/admin/messages" className="card lift grid gap-1 p-5">
          <span className="display text-[34px] leading-none">Chats</span>
          <span className="font-semibold">Read conversations</span>
          <span className="text-[13px] text-muted">Students are told organisers can read messages. Every time you open one, it&apos;s logged.</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Students", stats.users], ["Live listings", stats.live], ["Rehomed", stats.gone], ["Credits issued", stats.issued / 100]].map(([k, v]) => <div key={String(k)} className="card grid gap-0.5 p-4"><div className="display text-[28px] leading-none tabular-nums">{v}</div><div className="text-[13px] text-muted">{k}</div></div>)}
      </div>

      <section className="card grid gap-2 p-5 sm:p-7">
        <h2>Current draw</h2>
        {draw ? (
          <>
            <p className="text-[15px]"><b className="font-semibold">{draw.title}</b> · ends {fmtDateTime(draw.ends_at)} · {pool.length} student{pool.length === 1 ? "" : "s"} in, {pool.reduce((a, e) => a + e.tickets, 0)} entries</p>
            <ul className="text-[14.5px] text-muted">{prizesFor(draw.id).map((p) => <li key={p.id}>• {p.title}{p.credit_cents ? ` (⭐ ${p.credit_cents / 100})` : ""}</li>)}</ul>
            {pool.length > 0 && <ul className="grid gap-0.5 text-[14.5px]">{pool.map((e) => <li key={e.user_id}>{e.name} ({e.house}): {e.giveaways} giveaways, {e.tickets} {e.tickets === 1 ? "entry" : "entries"}</li>)}</ul>}
            <form action={runDrawNow} className="mt-2"><input type="hidden" name="id" value={draw.id} /><button className="btn-primary">Pick winners now</button></form>
            <p className="text-[13px] text-muted">Otherwise winners are picked automatically when the end time passes.</p>
          </>
        ) : <p className="text-[15px] text-muted">None. Create one below.</p>}
      </section>

      <AdminForms granted={!!granted} hasDraw={!!draw} defaultEnd={toSchoolLocal(new Date(Date.now() + 14 * 86400_000))} zone={SCHOOL_TZ} />

      {past.length > 0 && (
        <section className="card grid gap-2 p-5 sm:p-7">
          <h2>Past draws</h2>
          <ul className="grid gap-1.5 text-[14.5px]">
            {past.map((d) => <li key={d.id}><b>{d.title}</b>: {prizesFor(d.id).map((p) => `${p.title}: ${p.winner_name ?? "nobody"}`).join("; ")}</li>)}
          </ul>
          <p className="text-[13px] text-muted">Credit prizes are added automatically. Anything physical, you hand over yourself. <Link href="/draw" className="a-link">Students&apos; page</Link></p>
        </section>
      )}

      <section className="card grid gap-3 p-5 sm:p-7">
        <h2>Organiser log</h2>
        {log.length === 0 ? <p className="text-[14px] text-muted">Nothing yet. Everything organisers do is written here.</p> : (
          <ul className="grid gap-1.5 text-[13.5px]">
            {log.map((e) => <li key={e.id} className="flex flex-wrap justify-between gap-x-4"><span><b className="font-semibold">{e.admin_name}</b> · {e.action}{e.target ? ` · ${e.target}` : ""}{e.note ? ` · ${e.note}` : ""}</span><span className="text-[12px] text-muted">{timeAgo(e.created_at)}</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
