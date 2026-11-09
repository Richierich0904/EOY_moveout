import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { currentDraw, entrants, pastDraws, prizesFor } from "@/lib/game";
import { getDb } from "@/lib/db";
import { runDrawNow } from "@/actions/game";
import { AdminForms } from "@/components/AdminForms";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Organisers" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ granted?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.is_admin) return <p className="card max-w-xl p-8 text-center text-muted">Admins only. Add your email to <code>ADMIN_EMAILS</code> in the environment to get in.</p>;
  const { granted } = await searchParams;
  const draw = currentDraw();
  const pool = draw ? entrants(draw) : [];
  const stats = getDb().prepare("SELECT (SELECT COUNT(*) FROM users WHERE verified=1) users, (SELECT COUNT(*) FROM listings WHERE status='available') live, (SELECT COUNT(*) FROM listings WHERE status='sold') gone, (SELECT COALESCE(SUM(delta),0) FROM credit_transactions WHERE delta>0) issued").get() as { users: number; live: number; gone: number; issued: number };

  return (
    <div className="grid max-w-3xl gap-8">
      <PageIntro eyebrow="Organisers" title="Run the swap" sub="Draws, credits, and how the term is going." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Students", stats.users], ["Live listings", stats.live], ["Rehomed", stats.gone], ["Credits issued", stats.issued / 100]].map(([k, v]) => <div key={String(k)} className="card grid gap-0.5 p-4"><div className="display text-[28px] leading-none tabular-nums">{v}</div><div className="text-[13px] text-muted">{k}</div></div>)}
      </div>

      <section className="card grid gap-2 p-5 sm:p-7">
        <h2>Current draw</h2>
        {draw ? (
          <>
            <p className="text-[15px]"><b className="font-semibold">{draw.title}</b> · ends {draw.ends_at} UTC · {pool.length} entrants, {pool.reduce((a, e) => a + e.tickets, 0)} tickets</p>
            <ul className="text-[14.5px] text-muted">{prizesFor(draw.id).map((p) => <li key={p.id}>• {p.title}{p.credit_cents ? ` (⭐ ${p.credit_cents / 100})` : ""}</li>)}</ul>
            {pool.length > 0 && <ul className="grid gap-0.5 text-[14.5px]">{pool.map((e) => <li key={e.user_id}>{e.name} ({e.house}): {e.giveaways} giveaways → {e.tickets} tickets</li>)}</ul>}
            <form action={runDrawNow} className="mt-2"><input type="hidden" name="id" value={draw.id} /><button className="btn-primary">Draw winners now</button></form>
            <p className="text-[13px] text-muted">Otherwise it draws itself when the end time passes.</p>
          </>
        ) : <p className="text-[15px] text-muted">None. Create one below.</p>}
      </section>

      <AdminForms granted={!!granted} hasDraw={!!draw} />

      {pastDraws(10).length > 0 && (
        <section className="card grid gap-2 p-5 sm:p-7">
          <h2>Past draws</h2>
          <ul className="grid gap-1.5 text-[14.5px]">
            {pastDraws(10).map((d) => <li key={d.id}><b>{d.title}</b>: {prizesFor(d.id).map((p) => `${p.title} → ${p.winner_name ?? "nobody"}`).join("; ")}</li>)}
          </ul>
          <p className="text-[13px] text-muted">Credit prizes are paid automatically. Anything physical, you hand over yourself. <Link href="/lottery" className="a-link">Public page</Link></p>
        </section>
      )}
    </div>
  );
}
