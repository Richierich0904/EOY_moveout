import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { STAFF_NOTICE } from "@/lib/config";
import { listThreads } from "@/lib/social";
import { timeAgo } from "@/lib/format";
import { PageIntro } from "@/components/PageIntro";
import { Face } from "@/components/Avatar";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireViewer();
  const threads = listThreads(user.id);
  const unread = threads.reduce((a, t) => a + t.unread, 0);
  return (
    <div className="grid max-w-2xl gap-10">
      <PageIntro eyebrow="Messages" title={unread ? `${unread} new message${unread === 1 ? "" : "s"}` : "All caught up"} sub="Agree on a spot and a time. Everything else happens in person." />
      <p className="bg-bg-deep px-3.5 py-2.5 text-[12.5px] text-muted">{STAFF_NOTICE}</p>
      {threads.length === 0 ? (
        <p className="card p-10 text-muted">No conversations yet. Message a seller from any listing.</p>
      ) : (
        <ul className="card reveal divide-y divide-line overflow-hidden">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/messages/${t.id}`} className="grid grid-cols-[auto_1fr] items-center gap-3.5 px-5 py-4 transition-colors hover:bg-bg">
                <span className={`rounded-full ${t.unread ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : ""}`}>{t.unread > 0 && <span className="sr-only">Unread. </span>}<Face name={t.other_name} avatar={t.other_avatar} size={44} /></span>
                <span className="min-w-0">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate ${t.unread ? "font-bold" : "font-semibold"}`}>{t.other_name}</span>
                    <span className="shrink-0 text-[12.5px] text-muted">{timeAgo(t.last_message_at)}</span>
                  </span>
                  <span className="block truncate text-[13.5px] text-accent">{t.subject}</span>
                  <span className="flex items-center gap-2 text-[14px] text-muted">
                    <span className="truncate">{t.last_body}</span>
                    {t.unread > 0 && <span className="ml-auto rounded-full bg-accent px-2 text-[11px] font-bold leading-5 text-white">{t.unread}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
