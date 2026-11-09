import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getMessages, getThread, markThreadRead } from "@/lib/social";
import { REPORT_REASONS, iBlocked, isBlocked } from "@/lib/moderation";
import { blockUser, unblockUser } from "@/actions/moderation";
import { STAFF_NOTICE } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { ThreadForm } from "@/components/ThreadForm";
import { ReportForm } from "@/components/ReportForm";

export const metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireViewer();
  const { id } = await params;
  const t = getThread(Number(id), user.id);
  if (!t) notFound();
  markThreadRead(t.id, user.id);
  getDb().prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND link = ?").run(user.id, `/messages/${t.id}`);
  const msgs = getMessages(t.id);
  const link = t.listing_id ? `/listings/${t.listing_id}` : t.want_id ? `/wanted/${t.want_id}` : null;
  const blockedByMe = iBlocked(user.id, t.other_id);
  const blocked = blockedByMe || isBlocked(user.id, t.other_id);

  return (
    <div className="flex min-h-[70vh] max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <Link href="/messages" aria-label="All messages" className="flex h-9 w-9 items-center justify-center rounded-full bg-fg/[.07] transition hover:bg-fg/[.13]">←</Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${t.other_id}`} className="display block text-[22px] leading-tight hover:text-accent">{t.other_name}</Link>
          {link ? <Link href={link} className="a-link block truncate text-[14px]">{t.subject}</Link> : <div className="text-[14px] text-muted">{t.subject}</div>}
        </div>
      </div>
      <p className="bg-bg-deep px-3.5 py-2.5 text-[12.5px] text-muted" data-staff-notice>{STAFF_NOTICE} Keep it kind, and keep it about the swap.</p>
      <div className="flex flex-1 flex-col gap-2.5">
        {msgs.map((m) => {
          const me = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-[18px] px-4 py-2.5 ${me ? "rounded-br-[6px] bg-accent text-white" : "card rounded-bl-[6px]"}`}>
                <p className="whitespace-pre-wrap break-words text-[15.5px] leading-snug">{m.body}</p>
                <p className={`mt-1 text-[11px] ${me ? "text-white/75" : "text-muted"}`}>{timeAgo(m.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
      {blocked
        ? <p className="card p-4 text-[13.5px] text-muted">{blockedByMe ? `You've blocked ${t.other_name.split(" ")[0]}, so neither of you can send messages here.` : "You can't send messages in this conversation."}</p>
        : <ThreadForm threadId={t.id} />}
      <p className="text-[13px] text-muted">Agree on a time and one of the public meeting spots. Never meet in a dorm room. Pay in person, in cash or whatever app you both use.</p>
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-line pt-4">
        <ReportForm type="thread" id={t.id} reasons={REPORT_REASONS} what="this conversation" />
        <form action={blockedByMe ? unblockUser : blockUser}>
          <input type="hidden" name="user_id" value={t.other_id} /><input type="hidden" name="back" value={`/messages/${t.id}`} />
          <button className="text-[12px] text-muted underline-offset-2 hover:text-fg hover:underline">{blockedByMe ? `Unblock ${t.other_name.split(" ")[0]}` : `Block ${t.other_name.split(" ")[0]}`}</button>
        </form>
      </div>
    </div>
  );
}
