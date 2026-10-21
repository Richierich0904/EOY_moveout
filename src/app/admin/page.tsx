import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { currentDraw, entrants, pastDraws, prizesFor } from "@/lib/game";
import { getDb } from "@/lib/db";
import { runDrawNow } from "@/actions/game";
import { AdminForms } from "@/components/AdminForms";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ granted?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.is_admin) return <p className="rounded-xl border border-line bg-card p-8 text-center text-muted">Admins only. Add your email to <code>ADMIN_EMAILS</code> in the environment to get in.</p>;
  const { granted } = await searchParams;
  const draw = currentDraw();
  const pool = draw ? entrants(draw) : [];
  const stats = getDb().prepare("SELECT (SELECT COUNT(*) FROM users WHERE verified=1) users, (SELECT COUNT(*) FROM listings WHERE status='available') live, (SELECT COUNT(*) FROM listings WHERE status='sold') gone, (SELECT COALESCE(SUM(delta),0) FROM credit_transactions WHERE delta>0) issued").get() as { users: number; live: number; gone: number; issued: number };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Organisers</h1>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
        {[["Students", stats.users], ["Live listings", stats.live], ["Rehomed", stats.gone], ["Credits issued", stats.issued / 100]].map(([k, v]) => <div key={String(k)} className="rounded-xl border border-line bg-card p-3"><div className="text-xl font-black">{v}</div><div className="text-xs text-muted">{k}</div></div>)}
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-lg font-bold">Current draw</h2>
        {draw ? (
          <>
            <p className="mt-1"><b>{draw.title}</b> · ends {draw.ends_at} UTC · {pool.length} entrants, {pool.reduce((a, e) => a + e.tickets, 0)} tickets</p>
            <ul className="mt-2 text-sm text-muted">{prizesFor(draw.id).map((p) => <li key={p.id}>• {p.title}{p.credit_cents ? ` (⭐ ${p.credit_cents / 100})` : ""}</li>)}</ul>
            {pool.length > 0 && <ul className="mt-2 text-sm">{pool.map((e) => <li key={e.user_id}>{e.name} ({e.house}): {e.giveaways} giveaways → {e.tickets} tickets</li>)}</ul>}
            <form action={runDrawNow} className="mt-3"><input type="hidden" name="id" value={draw.id} /><button className="btn-primary">Draw winners now</button></form>
            <p className="mt-1 text-xs text-muted">Otherwise it draws itself when the end time passes.</p>
          </>
        ) : <p className="mt-1 text-sm text-muted">None. Create one below.</p>}
      </section>

      <AdminForms granted={!!granted} hasDraw={!!draw} />

      {pastDraws(10).length > 0 && (
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="text-lg font-bold">Past draws</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {pastDraws(10).map((d) => <li key={d.id}><b>{d.title}</b>: {prizesFor(d.id).map((p) => `${p.title} → ${p.winner_name ?? "nobody"}`).join("; ")}</li>)}
          </ul>
          <p className="mt-2 text-xs text-muted">Credit prizes are paid automatically. Anything physical, you hand over yourself. <Link href="/lottery" className="underline">Public page</Link></p>
        </section>
      )}
    </div>
  );
}
