"use client";

import { useActionState } from "react";
import { reportThing } from "@/actions/moderation";
import { FormError, FormNote, SubmitButton } from "./forms";

/** A quiet "Report" link that opens a short form. Used on listings, wanted posts, chats and profiles. */
export function ReportForm({ type, id, reasons, what }: { type: "listing" | "want" | "thread" | "user"; id: number; reasons: readonly string[]; what: string }) {
  const [state, action] = useActionState(reportThing, undefined);
  if (state?.ok) return <FormNote note={state.message} />;
  return (
    <details className="group text-[13px]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[12px] text-muted underline-offset-2 hover:text-fg hover:underline [&::-webkit-details-marker]:hidden">
        <span aria-hidden>⚑</span> Report {what}
      </summary>
      <form action={action} className="card mt-3 grid gap-3 p-4">
        <input type="hidden" name="type" value={type} /><input type="hidden" name="id" value={id} />
        <p className="text-muted">Tell the organisers what&apos;s wrong. The other person isn&apos;t told who reported it.</p>
        <div><label className="label" htmlFor={`report-reason-${type}-${id}`}>What&apos;s wrong?</label>
          <select id={`report-reason-${type}-${id}`} name="reason" required defaultValue="" className="input"><option value="" disabled>Pick a reason</option>{reasons.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div><label className="label" htmlFor={`report-details-${type}-${id}`}>Anything else? <span className="font-normal text-muted">(optional)</span></label>
          <textarea id={`report-details-${type}-${id}`} name="details" rows={2} maxLength={500} className="input" /></div>
        <FormError error={state?.error} />
        <SubmitButton className="btn-ghost justify-self-start">Send report</SubmitButton>
        <p className="text-[12px] text-muted">If you feel unsafe, don&apos;t wait for a reply. Talk to an adult you trust straight away.</p>
      </form>
    </details>
  );
}
