import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMessages, getThread, markThreadRead } from "@/lib/social";
import { sendMessage } from "@/actions/social";
import { timeAgo } from "@/lib/format";
import { SubmitButton } from "@/components/forms";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const t = getThread(Number(id), user.id);
  if (!t) notFound();
  markThreadRead(t.id, user.id);
  const msgs = getMessages(t.id);
  const link = t.listing_id ? `/listings/${t.listing_id}` : t.want_id ? `/wanted/${t.want_id}` : null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <Link href="/messages" aria-label="All messages" className="flex h-9 w-9 items-center justify-center rounded-full bg-fg/[.07] transition hover:bg-fg/[.13]">←</Link>
        <div className="min-w-0">
          <div className="display text-[22px] leading-tight">{t.other_name}</div>
          {link ? <Link href={link} className="a-link block truncate text-[14px]">{t.subject}</Link> : <div className="text-[14px] text-muted">{t.subject}</div>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {msgs.map((m) => {
          const me = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-[18px] px-4 py-2.5 ${me ? "rounded-br-[6px] bg-accent text-white" : "card rounded-bl-[6px]"}`}>
                <p className="whitespace-pre-wrap text-[15.5px] leading-snug">{m.body}</p>
                <p className={`mt-1 text-[11px] ${me ? "text-white/75" : "text-muted"}`}>{timeAgo(m.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form action={sendMessage} className="sticky bottom-[calc(64px+env(safe-area-inset-bottom,0px))] flex gap-2 bg-bg/90 py-2 backdrop-blur sm:bottom-0">
        <input type="hidden" name="thread_id" value={t.id} />
        <label htmlFor="thread-body" className="sr-only">Message</label>
        <input id="thread-body" name="body" required autoComplete="off" placeholder="Write a message…" className="input" />
        <SubmitButton>Send</SubmitButton>
      </form>
      <p className="text-center text-[13px] text-muted">Agree on a spot and a time. Meet somewhere public. Pay in cash or whatever app you both use.</p>
    </div>
  );
}
