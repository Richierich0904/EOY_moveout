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
    <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: "70vh" }}>
      <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
        <Link href="/messages" className="btn-ghost">←</Link>
        <div className="min-w-0"><div className="font-bold">{t.other_name}</div>{link ? <Link href={link} className="block truncate a-link text-[13px] underline">{t.subject}</Link> : <div className="text-[13px] text-muted">{t.subject}</div>}</div>
      </div>
      <div className="flex-1 space-y-2">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.sender_id === user.id ? "bg-subheader text-white" : "bg-card border border-line"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[10px] ${m.sender_id === user.id ? "opacity-75" : "text-muted"}`}>{timeAgo(m.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
      <form action={sendMessage} className="sticky bottom-16 mt-4 flex gap-2 bg-bg py-2 sm:bottom-0">
        <input type="hidden" name="thread_id" value={t.id} />
        <input name="body" required autoComplete="off" placeholder="Write a message…" className="input" />
        <SubmitButton>Send</SubmitButton>
      </form>
      <p className="text-[12px] text-muted">Tip: agree on a spot and a time. Meet somewhere public. Pay in cash or whatever app you both use.</p>
    </div>
  );
}
