import Link from "next/link";
import { requireAdminViewer } from "@/lib/auth";
import { adminThreads } from "@/lib/moderation";
import { STAFF_NOTICE } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Conversations" };

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminViewer();
  const { q } = await searchParams;
  const threads = adminThreads(q);
  return (
    <div className="grid max-w-3xl gap-8">
      <PageIntro eyebrow="Organisers" title="Conversations" sub={`Students see this notice in every chat: “${STAFF_NOTICE}” Opening a conversation is recorded in the organiser log.`}>
        <Link href="/admin" className="btn-ghost">Back to organisers</Link>
        <Link href="/admin/reports" className="btn-ghost">Reports</Link>
      </PageIntro>
      <form action="/admin/messages" role="search" className="relative max-w-sm">
        <label htmlFor="admin-q" className="sr-only">Search conversations</label>
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
        <input id="admin-q" name="q" defaultValue={q} maxLength={80} placeholder="A student's name, email, or a word" className="input pl-10" />
      </form>
      {threads.length === 0 ? <p className="card p-8 text-muted">No conversations{q ? ` match “${q}”` : " yet"}.</p> : (
        <ul className="card divide-y divide-line">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/messages/${t.id}`} className="grid gap-0.5 px-5 py-3.5 transition-colors hover:bg-bg">
                <span className="flex items-baseline justify-between gap-3"><span className="font-semibold">{t.a_name} and {t.b_name}</span><span className="shrink-0 text-[12px] text-muted">{timeAgo(t.last_message_at)}</span></span>
                <span className="truncate text-[13px] text-accent">{t.subject}</span>
                <span className="truncate text-[13px] text-muted">{t.messages} message{t.messages === 1 ? "" : "s"}{t.last_body ? ` · ${t.last_body}` : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
