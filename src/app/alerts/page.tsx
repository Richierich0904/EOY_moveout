import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { deleteSavedSearch, markAllRead } from "@/actions/social";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/alerts");
  const { saved } = await searchParams;
  const db = getDb();
  const searches = db.prepare("SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC").all(user.id) as
    { id: number; query: string; category: string | null; free_only: number; max_price_cents: number | null }[];
  const notes = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(user.id) as
    { id: number; title: string; body: string; link: string; read: number; created_at: string }[];
  const unread = notes.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Saved searches</h1>
        <p className="text-[13px] text-muted">We&apos;ll ping you the moment someone lists a match. Set one up from any search on the <Link href="/" className="underline">browse page</Link>.</p>
        {saved && <p className="mt-2 rounded-lg bg-[#fffbf3] p-2 text-sm">Saved. You&apos;ll hear about it here.</p>}
        {searches.length === 0 ? <p className="mt-3 text-sm text-muted">None yet.</p> : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
            {searches.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3">
                <span className="flex-1 text-sm">🔔 {[s.query && `“${s.query}”`, s.category && categoryLabel(s.category), s.free_only ? "free only" : null, s.max_price_cents !== null && `under ${money(s.max_price_cents)}`].filter(Boolean).join(" · ")}</span>
                <form action={deleteSavedSearch}><input type="hidden" name="id" value={s.id} /><button className="text-sm text-muted hover:text-free">Remove</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Notifications</h2>{unread && <form action={markAllRead}><button className="a-link text-[13px]">Mark all read</button></form>}</div>
        {notes.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing yet.</p> : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
            {notes.map((n) => (
              <li key={n.id}><Link href={n.link} className={`block p-3 hover:bg-bg ${n.read ? "" : "bg-[#fffbf3]"}`}>
                <div className="flex justify-between gap-2"><span className={n.read ? "font-medium" : "font-bold"}>{n.title}</span><span className="shrink-0 text-[12px] text-muted">{timeAgo(n.created_at)}</span></div>
                <div className="text-[13px] text-muted">{n.body}</div>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
