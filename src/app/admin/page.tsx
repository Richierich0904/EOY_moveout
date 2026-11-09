import Link from "next/link";
import { requireAdminViewer } from "@/lib/auth";
import { currentDraw, entrants, pastDraws, prizesFor } from "@/lib/game";
import { getDb } from "@/lib/db";
import { runDrawNow } from "@/actions/game";
import { heldCount, openReportCount, recentLog } from "@/lib/moderation";
import { judgeStats } from "@/lib/judge";
import { SCHOOL_TZ } from "@/lib/config";
import { fmtDateTime, toSchoolLocal } from "@/lib/time";
import { timeAgo } from "@/lib/format";
import { AdminForms, MailTest } from "@/components/AdminForms";
import { mailSummary } from "@/lib/mail";
import { hits } from "@/lib/limits";
import { IS_PROD, DEMO_MODE } from "@/lib/config";
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
  const ai = judgeStats(7);
  const mail = mailSummary();
  const mailFailed = hits("mail:fail", 86400);

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

      <section className="card grid gap-3 p-5 sm:p-7" data-mail>
        <h2>Email</h2>
        {mail.on ? (
          <>
            <p className="text-[15px]">Sign-up and password-reset codes are sent through <b className="font-semibold">{mail.server}</b>, from <b className="font-semibold">{mail.from}</b>.</p>
            {mailFailed > 0 && <p className="border border-fg p-3 text-[13.5px]"><b className="font-semibold">{mailFailed} email{mailFailed === 1 ? "" : "s"} could not be sent in the last day.</b> Students who were affected saw “We couldn&apos;t send the email”. Send yourself a test below to see the reason.</p>}
            <MailTest />
            <p className="text-[13px] text-muted">Free email plans have a daily limit. If many students join on the same day, codes can stop arriving until the next day.</p>
          </>
        ) : (
          <p className="text-[15px] text-muted">{IS_PROD && !DEMO_MODE ? "Not set up, so nobody can sign up yet." : "Not set up. Codes are shown on screen instead, which is only safe for testing."} Add <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code> and <code>SMTP_PASS</code> to the server&apos;s settings to send real email.</p>
        )}
      </section>

      <section className="card grid gap-2 p-5 sm:p-7" data-judge>
        <h2>AI safety judge</h2>
        {ai.on ? (
          <>
            <p className="text-[15px]">In the last 7 days it checked <b className="font-semibold">{ai.checked}</b> post{ai.checked === 1 ? "" : "s"} and photo{ai.checked === 1 ? "" : "s"}, and held <b className="font-semibold">{ai.held}</b> for you to look at.{ai.checked > 0 ? ` A check takes about ${(ai.avg_ms / 1000).toFixed(1)} seconds.` : ""}</p>
            {ai.unavailable > 0 && <p className="border border-fg p-3 text-[13.5px]"><b className="font-semibold">{ai.unavailable} check{ai.unavailable === 1 ? "" : "s"} could not be done</b> because the AI service did not answer. Those posts went by the word list alone. If this keeps happening, check the API key and the server log.</p>}
            <p className="text-[13px] text-muted">It reads listings, wanted posts and photos before they go live, using {ai.model}. It never sees names, emails or messages, and it only advises: anything it holds waits in <Link href="/admin/reports" className="a-link">Reports and review</Link> for your decision.</p>
          </>
        ) : <p className="text-[15px] text-muted">Off. Posts are checked by the banned-word list only. Set <code>ANTHROPIC_API_KEY</code> on the server to turn the AI judge on.</p>}
      </section>

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
