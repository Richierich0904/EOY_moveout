import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listThreads } from "@/lib/social";
import { timeAgo } from "@/lib/format";
import { PageIntro } from "@/components/PageIntro";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const threads = listThreads(user.id);
  const unread = threads.reduce((a, t) => a + t.unread, 0);
  return (
    <div className="mx-auto grid max-w-2xl gap-10">
      <PageIntro eyebrow="Messages" title={unread ? `${unread} new message${unread === 1 ? "" : "s"}` : "All caught up"} sub="Agree on a spot and a time. Everything else happens in person." />
      {threads.length === 0 ? (
        <p className="card p-10 text-center text-muted">No conversations yet. Message a seller from any listing.</p>
      ) : (
        <ul className="card reveal divide-y divide-line overflow-hidden">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/messages/${t.id}`} className="grid grid-cols-[auto_1fr] items-center gap-3.5 px-5 py-4 transition-colors hover:bg-bg">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-semibold ${t.unread ? "bg-accent text-white" : "bg-accent/15 text-accent-deep"}`}>
                  {t.other_name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
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
