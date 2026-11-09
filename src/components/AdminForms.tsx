"use client";

import { useActionState, useRef } from "react";
import { createDraw, grantCredits } from "@/actions/game";
import { resolveReport, sendTestEmail, suspendUser } from "@/actions/moderation";
import { FormError, FormNote, SubmitButton, useKeptForm } from "./forms";

export function AdminForms({ granted, hasDraw, defaultEnd, zone }: { granted: boolean; hasDraw: boolean; defaultEnd: string; zone: string }) {
  const [d, drawSubmit, drawPending] = useKeptForm(createDraw);
  const [g, grantAction] = useActionState(grantCredits, undefined);
  return (
    <>
      <section className="card grid gap-4 p-5 sm:p-7">
        <h2>{hasDraw ? "Queue the next draw" : "Start a draw"}</h2>
        <form onSubmit={drawSubmit} className="grid gap-4">
          <div><label className="label" htmlFor="draw-title">Name</label><input id="draw-title" name="title" required maxLength={80} placeholder="e.g. May move-out draw" className="input" /></div>
          <div><label className="label" htmlFor="draw-desc">Blurb</label><input id="draw-desc" name="description" maxLength={300} placeholder="Give away 3 things, get an entry. Winners announced at dorm meeting." className="input" /></div>
          <div><label className="label" htmlFor="draw-end">Ends <span className="font-normal text-muted">(school time, {zone})</span></label><input id="draw-end" name="ends_at" type="datetime-local" required defaultValue={defaultEnd} className="input" /></div>
          <p className="label">Prizes <span className="font-normal text-muted">(credits are added automatically; leave 0 for a prize you hand over yourself)</span></p>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[1fr_110px] gap-2">
              <input aria-label={`Prize ${i + 1}`} name={`prize_${i}`} maxLength={80} placeholder={["First prize, e.g. $25 school store voucher", "Second prize", "Third prize", "", "", ""][i]} className="input" />
              <input aria-label={`Prize ${i + 1} credits`} name={`credits_${i}`} type="number" min="0" max="100" step="1" placeholder="⭐ credits" className="input" />
            </div>
          ))}
          <FormError error={d?.error} />
          <SubmitButton pending={drawPending} className="btn-primary justify-self-start">Create draw</SubmitButton>
        </form>
      </section>
      <section className="card grid gap-3 p-5 sm:p-7">
        <h2>Grant credits</h2>
        <p className="text-[13px] text-muted">For helping at move-out day, or fixing a mistake. Students spend credits on boosting a listing. A negative amount takes credits away, but never below zero.</p>
        {granted && <p className="bg-bg-deep p-3 text-[14.5px]">Done.</p>}
        <form action={grantAction} className="grid gap-2 sm:grid-cols-[1fr_100px_1fr_auto]">
          <input aria-label="Student email" name="email" type="email" required placeholder="student@school.edu" className="input" />
          <input aria-label="Credits" name="amount" type="number" step="1" min="-100" max="100" required placeholder="⭐ 3" className="input" />
          <input aria-label="Reason" name="reason" maxLength={120} placeholder="Reason (shown to them)" className="input" />
          <SubmitButton>Grant</SubmitButton>
          <div className="sm:col-span-4"><FormError error={g?.error} /></div>
        </form>
      </section>
    </>
  );
}

/** The buttons under one report in the organisers' queue. */
export function ReportDecision({ id, canRemove, canSuspend, canRemovePhoto }: { id: number; canRemove: boolean; canSuspend: boolean; canRemovePhoto: boolean }) {
  const [state, action] = useActionState(resolveReport, undefined);
  const decision = useRef<HTMLInputElement>(null);
  // Each button writes its choice into the hidden field just before the form is sent.
  const pick = (value: string) => () => { if (decision.current) decision.current.value = value; };
  if (state?.ok) return <FormNote note="Dealt with." />;
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <input ref={decision} type="hidden" name="decision" defaultValue="" />
      <label className="sr-only" htmlFor={`note-${id}`}>Note</label>
      <input id={`note-${id}`} name="note" maxLength={200} placeholder="Reason or note (the student sees it if you act)" className="input" />
      <div className="flex flex-wrap gap-2">
        <button onClick={pick("dismiss")} data-decision="dismiss" className="btn-ghost">No action needed</button>
        {canRemove && <button onClick={pick("remove")} data-decision="remove" className="btn-ghost">Remove the post</button>}
        {canRemovePhoto && <button onClick={pick("photo")} data-decision="photo" className="btn-ghost">Remove profile photo</button>}
        {canSuspend && <button onClick={pick("suspend")} data-decision="suspend" className="btn-orange">Pause the account</button>}
      </div>
      <FormError error={state?.error} />
    </form>
  );
}

export function SuspendForm() {
  const [state, action] = useActionState(suspendUser, undefined);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
      <input aria-label="Student email" name="email" type="email" required placeholder="student@school.edu" className="input" />
      <input aria-label="Reason" name="reason" required maxLength={200} placeholder="Reason (the student sees it)" className="input" />
      <SubmitButton className="btn-orange">Pause account</SubmitButton>
      <div className="sm:col-span-3"><FormError error={state?.error} /><FormNote note={state?.message} /></div>
    </form>
  );
}

/** "Send me a test email", on the organiser page. */
export function MailTest() {
  const [state, action] = useActionState(sendTestEmail, undefined);
  return (
    <form action={action} className="grid gap-2">
      <SubmitButton className="btn-ghost justify-self-start">Send me a test email</SubmitButton>
      <FormError error={state?.error} /><FormNote note={state?.message} />
    </form>
  );
}
