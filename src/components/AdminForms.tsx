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
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-lg font-bold">{hasDraw ? "Queue the next draw" : "Start a draw"}</h2>
        <form action={drawAction} className="mt-3 space-y-3">
          <div><label className="label">Name</label><input name="title" required placeholder="e.g. May move-out draw" className="input" /></div>
          <div><label className="label">Blurb</label><input name="description" placeholder="Give away 3 things, get a ticket. Winners announced at house meeting." className="input" /></div>
          <div><label className="label">Ends</label><input name="ends_at" type="datetime-local" required defaultValue={inTwoWeeks} className="input" /></div>
          <label className="label">Prizes <span className="font-normal">(credits are paid automatically; leave 0 for a physical prize)</span></label>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[1fr_110px] gap-2">
              <input name={`prize_${i}`} placeholder={["First prize, e.g. $25 school store voucher", "Second prize", "Third prize", "", "", ""][i]} className="input" />
              <input name={`credits_${i}`} type="number" min="0" step="1" placeholder="⭐ credits" className="input" />
            </div>
          ))}
          <FormError error={d?.error} />
          <SubmitButton>Create draw</SubmitButton>
        </form>
      </section>
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-lg font-bold">Grant credits</h2>
        <p className="text-sm text-muted">For prizes handed out offline, helping at move-out day, or fixing mistakes. Negative amounts deduct.</p>
        {granted && <p className="mt-2 rounded-lg bg-accent/10 p-2 text-sm">Done.</p>}
        <form action={grantAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_100px_1fr_auto]">
          <input name="email" type="email" required placeholder="student@school.edu" className="input" />
          <input name="amount" type="number" step="1" required placeholder="⭐ 10" className="input" />
          <input name="reason" placeholder="Reason (shown to them)" className="input" />
          <SubmitButton>Grant</SubmitButton>
          <div className="sm:col-span-4"><FormError error={g?.error} /></div>
        </form>
      </section>
    </>
  );
}
