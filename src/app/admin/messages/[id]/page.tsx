import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminViewer } from "@/lib/auth";
import { adminThread, logAdminOnce } from "@/lib/moderation";
import { getMessages } from "@/lib/social";
import { fmtDateTime } from "@/lib/time";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Conversation" };

/** A read-only view of one conversation. Organisers can't send or change messages here. */
export default async function AdminThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminViewer();
  const { id } = await params;
  const t = adminThread(Number(id));
  if (!t) notFound();
  logAdminOnce(admin, "Read a conversation", `${t.a_name} and ${t.b_name}`, t.subject);
  const msgs = getMessages(t.id);
  return (
    <div className="grid max-w-2xl gap-8">
      <PageIntro eyebrow="Organisers · read only" title={`${t.a_name} and ${t.b_name}`} sub={`About: ${t.subject}. This view has been added to the organiser log.`}>
        <Link href="/admin/messages" className="btn-ghost">All conversations</Link>
        <Link href={`/u/${t.a_id}`} className="btn-ghost">{t.a_name.split(" ")[0]}&apos;s profile</Link>
        <Link href={`/u/${t.b_id}`} className="btn-ghost">{t.b_name.split(" ")[0]}&apos;s profile</Link>
      </PageIntro>
      {msgs.length === 0 ? <p className="card p-6 text-muted">No messages.</p> : (
        <ol className="card divide-y divide-line">
          {msgs.map((m) => (
            <li key={m.id} className="grid gap-1 px-5 py-3.5">
              <span className="flex flex-wrap items-baseline justify-between gap-2"><b className="font-semibold">{m.sender_name}</b><span className="text-[12px] text-muted">{fmtDateTime(m.created_at)}</span></span>
              <p className="whitespace-pre-wrap break-words text-[14.5px]">{m.body}</p>
            </li>
          ))}
        </ol>
      )}
      <p className="text-[13px] text-muted">To act on what you&apos;ve read, pause an account from <Link href="/admin/reports" className="a-link">Reports and review</Link>, and follow the school&apos;s safeguarding steps for anything serious.</p>
    </div>
  );
}
