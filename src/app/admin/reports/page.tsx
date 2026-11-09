import Link from "next/link";
import { requireAdminViewer } from "@/lib/auth";
import { heldPosts, listReports, suspendedUsers } from "@/lib/moderation";
import { reviewHeld, unsuspendUser } from "@/actions/moderation";
import { timeAgo } from "@/lib/format";
import { fmtDate } from "@/lib/time";
import { ReportDecision, SuspendForm } from "@/components/AdminForms";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireAdminViewer();
  const open = listReports("open");
  const done = listReports("resolved", 15);
  const held = heldPosts();
  const paused = suspendedUsers();

  return (
    <div className="grid max-w-3xl gap-10">
      <PageIntro eyebrow="Organisers" title="Reports and review" sub="Reports from students, posts and photos held by the word list or the AI judge, and paused accounts. The AI only advises. You decide.">
        <Link href="/admin" className="btn-ghost">Back to organisers</Link>
        <Link href="/admin/messages" className="btn-ghost">Read conversations</Link>
      </PageIntro>

      <section className="grid gap-4">
        <h2>Open reports<span className="count ml-1">({open.length})</span></h2>
        {open.length === 0 ? <p className="card p-6 text-muted">Nothing waiting. </p> : (
          <ul className="grid gap-4">
            {open.map((r) => (
              <li key={r.id} className="card grid gap-3 p-5" data-report>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{r.reason}</span>
                  <span className="text-[12px] text-muted">from {r.reporter_name} · {timeAgo(r.created_at)}</span>
                </div>
                {r.target ? (
                  <p className="text-[14px]">{r.target.link ? <Link href={r.target.link} className="a-link">{r.target.label}</Link> : r.target.label}{r.target.ownerName && r.target_type !== "user" ? <> · about <Link href={`/u/${r.target.ownerId}`} className="a-link">{r.target.ownerName}</Link></> : null}</p>
                ) : <p className="text-[14px] text-muted">The reported item has since been deleted.</p>}
                {r.details && <p className="whitespace-pre-wrap break-words border-l-[3px] border-line pl-3 text-[13.5px] text-muted">{r.details}</p>}
                <ReportDecision id={r.id} canRemove={!!r.target && (r.target_type === "listing" || r.target_type === "want")} canSuspend={!!r.target?.ownerId} canRemovePhoto={!!r.target?.ownerId && r.target_type === "user"} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <h2>Held for review<span className="count ml-1">({held.length})</span></h2>
        {held.length === 0 ? <p className="card p-6 text-muted">Nothing is being held.</p> : (
          <ul className="grid gap-4">
            {held.map((h) => (
              <li key={h.type + h.id} className="card grid gap-3 p-5" data-held={h.type}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  {h.type === "avatar"
                    ? <Link href={`/u/${h.owner_id}`} className="a-link font-semibold">New profile photo for {h.owner_name}</Link>
                    : <Link href={h.type === "listing" ? `/listings/${h.id}` : `/wanted/${h.id}`} className="a-link font-semibold">{h.type === "listing" ? "Listing" : "Wanted post"}: {h.title}</Link>}
                  <span className="text-[12px] text-muted">{h.type === "avatar" ? "" : `by ${h.owner_name} · `}{timeAgo(h.created_at)}</span>
                </div>
                {h.description && <p className="whitespace-pre-wrap break-words text-[13.5px] text-muted">{h.description}</p>}
                {h.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {h.photos.map((f) => <img key={f} src={`/uploads/${f}`} alt={h.type === "avatar" ? "The new profile photo" : "A photo from the post"} className="h-28 w-28 border border-line object-cover" />)}
                  </div>
                )}
                <p className="text-[13px]" data-held-why><b className="font-semibold">Held by the {h.by.toLowerCase()}.</b> {h.why}</p>
                <div className="flex flex-wrap gap-2">
                  <form action={reviewHeld}><input type="hidden" name="type" value={h.type} /><input type="hidden" name="id" value={h.id} /><input type="hidden" name="decision" value="approve" /><button data-decision="approve" className="btn-primary">It&apos;s fine, publish it</button></form>
                  <form action={reviewHeld}><input type="hidden" name="type" value={h.type} /><input type="hidden" name="id" value={h.id} /><input type="hidden" name="decision" value="reject" /><button data-decision="reject" className="btn-ghost">Not allowed, remove it</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card grid gap-4 p-5 sm:p-7">
        <h2>Pause an account</h2>
        <p className="text-[13px] text-muted">A paused student can&apos;t post, message or confirm anything, and their listings come off the shelves. They see the reason and who to talk to.</p>
        <SuspendForm />
        {paused.length > 0 && (
          <ul className="grid gap-2 border-t border-line pt-4">
            {paused.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 text-[14px]" data-paused>
                <span><b className="font-semibold">{u.name}</b> <span className="text-muted">· {u.house} · since {fmtDate(u.suspended_at)} · {u.suspended_reason}</span></span>
                <form action={unsuspendUser}><input type="hidden" name="user_id" value={u.id} /><button className="chip">Un-pause</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="grid gap-3">
          <h2>Recently dealt with</h2>
          <ul className="card divide-y divide-line text-[13.5px]">
            {done.map((r) => <li key={r.id} className="flex flex-wrap justify-between gap-x-4 px-5 py-3"><span>{r.target?.label ?? "Deleted item"} · {r.reason}</span><span className="text-muted">{r.resolution}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
