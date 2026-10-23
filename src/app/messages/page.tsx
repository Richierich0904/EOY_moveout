import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listThreads } from "@/lib/social";
import { timeAgo } from "@/lib/format";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const threads = listThreads(user.id);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Messages</h1>
      {threads.length === 0 ? (
        <p className="rounded-lg border border-line bg-card p-8 text-center text-muted">No conversations yet. Message a seller from any listing.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
          {threads.map((t) => (
            <li key={t.id}><Link href={`/messages/${t.id}`} className={`block p-4 hover:bg-bg ${t.unread ? "bg-[#fffbf3]" : ""}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className={`truncate ${t.unread ? "font-bold" : "font-medium"}`}>{t.other_name} <span className="text-muted">· {t.subject}</span></span>
                <span className="shrink-0 text-[12px] text-muted">{timeAgo(t.last_message_at)}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-muted"><span className="truncate">{t.last_body}</span>{t.unread > 0 && <span className="ml-auto rounded-full bg-accent px-2 text-xs font-bold text-white">{t.unread}</span>}</div>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
