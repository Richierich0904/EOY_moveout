"use client";

import { useActionState } from "react";
import { createDraw, grantCredits } from "@/actions/game";
import { FormError, SubmitButton } from "./forms";

export function AdminForms({ granted, hasDraw }: { granted: boolean; hasDraw: boolean }) {
  const [d, drawAction] = useActionState(createDraw, undefined);
  const [g, grantAction] = useActionState(grantCredits, undefined);
  const inTwoWeeks = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 16);
  return (
    <>
      <section className="card grid gap-4 p-5 sm:p-7">
        <h2>{hasDraw ? "Queue the next draw" : "Start a draw"}</h2>
        <form action={drawAction} className="grid gap-4">
          <div><label className="label" htmlFor="draw-title">Name</label><input id="draw-title" name="title" required placeholder="e.g. May move-out draw" className="input" /></div>
          <div><label className="label" htmlFor="draw-desc">Blurb</label><input id="draw-desc" name="description" placeholder="Give away 3 things, get a ticket. Winners announced at dorm meeting." className="input" /></div>
          <div><label className="label" htmlFor="draw-end">Ends</label><input id="draw-end" name="ends_at" type="datetime-local" required defaultValue={inTwoWeeks} className="input" /></div>
          <p className="label">Prizes <span className="font-normal text-muted">(credits are paid automatically; leave 0 for a physical prize)</span></p>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[1fr_110px] gap-2">
              <input aria-label={`Prize ${i + 1}`} name={`prize_${i}`} placeholder={["First prize, e.g. $25 school store voucher", "Second prize", "Third prize", "", "", ""][i]} className="input" />
              <input aria-label={`Prize ${i + 1} credits`} name={`credits_${i}`} type="number" min="0" step="1" placeholder="⭐ credits" className="input" />
            </div>
          ))}
          <FormError error={d?.error} />
          <SubmitButton className="btn-primary justify-self-start">Create draw</SubmitButton>
        </form>
      </section>
      <section className="card grid gap-3 p-5 sm:p-7">
        <h2>Grant credits</h2>
        <p className="text-[13px] text-muted">For prizes handed out offline, helping at move-out day, or fixing mistakes. Negative amounts deduct.</p>
        {granted && <p className="bg-bg-deep p-3 text-[14.5px]">Done.</p>}
        <form action={grantAction} className="grid gap-2 sm:grid-cols-[1fr_100px_1fr_auto]">
          <input aria-label="Student email" name="email" type="email" required placeholder="student@school.edu" className="input" />
          <input aria-label="Credits" name="amount" type="number" step="1" required placeholder="⭐ 10" className="input" />
          <input aria-label="Reason" name="reason" placeholder="Reason (shown to them)" className="input" />
          <SubmitButton>Grant</SubmitButton>
          <div className="sm:col-span-4"><FormError error={g?.error} /></div>
        </form>
      </section>
    </>
  );
}
