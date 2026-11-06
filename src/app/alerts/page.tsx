import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { deleteSavedSearch, markAllRead } from "@/actions/social";
import { PageIntro } from "@/components/PageIntro";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/alerts");
  const { saved } = await searchParams;
  const db = getDb();
  const searches = db.prepare("SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC").all(user.id) as
    { id: number; query: string; category: string | null; free_only: number; max_price_cents: number | null }[];
  const notes = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(user.id) as
    { id: number; title: string; body: string; link: string; read: number; created_at: string }[];
  const unread = notes.filter((n) => !n.read).length;

  return (
    <div className="mx-auto grid max-w-2xl gap-12">
      <PageIntro eyebrow="Alerts" title={unread ? `${unread} thing${unread === 1 ? "" : "s"} you should see` : "Nothing new"} sub="Saved searches ping you the moment someone lists a match." />

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3"><h2>Notifications</h2>{unread > 0 && <form action={markAllRead}><button className="more">Mark all read</button></form>}</div>
        {notes.length === 0 ? <p className="card p-8 text-center text-muted">Nothing yet.</p> : (
          <ul className="card divide-y divide-line overflow-hidden">
            {notes.map((n) => (
              <li key={n.id}>
                <Link href={n.link} className="relative block py-4 pl-9 pr-5 transition-colors hover:bg-bg">
                  {!n.read && <span aria-label="Unread" className="absolute left-4 top-[22px] h-2 w-2 rounded-full bg-accent" />}
                  <span className="flex justify-between gap-3"><span className={n.read ? "font-medium" : "font-bold"}>{n.title}</span><span className="shrink-0 text-[12.5px] text-muted">{timeAgo(n.created_at)}</span></span>
                  <span className="block text-[14px] text-muted">{n.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="reveal grid gap-4">
        <h2>Saved searches</h2>
        {saved && <p className="rounded-[10px] bg-moss/12 p-3 text-[14.5px]">Saved. You&apos;ll hear about it here.</p>}
        {searches.length === 0 ? (
          <p className="card p-6 text-[15px] text-muted">None yet. Search from the <Link href="/#browse" className="a-link">shelves</Link> and tap “Alert me about new matches”.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {searches.map((s) => (
              <li key={s.id} className="inline-flex items-center gap-2 rounded-full bg-card py-1.5 pl-4 pr-1.5 text-[14px] shadow-soft">
                <span>{[s.query && `“${s.query}”`, s.category && categoryLabel(s.category), s.free_only ? "free only" : null, s.max_price_cents !== null && `under ${money(s.max_price_cents)}`].filter(Boolean).join(" · ")}</span>
                <form action={deleteSavedSearch}><input type="hidden" name="id" value={s.id} /><button aria-label="Remove saved search" className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-fg/[.07] hover:text-fg">×</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
