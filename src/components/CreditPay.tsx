"use client";

import { useActionState } from "react";
import { payWithCredits } from "@/actions/game";
import { FormError, SubmitButton } from "./forms";

export function CreditPay({ listingId, priceCents, balance }: { listingId: number; priceCents: number; balance: number }) {
  const [state, action] = useActionState(payWithCredits, undefined);
  const enough = balance >= priceCents;
  return (
    <form action={action} className="space-y-2 rounded-xl border border-dashed border-accent/50 p-3">
      <input type="hidden" name="id" value={listingId} />
      <p className="text-sm">⭐ Seller accepts <b>{priceCents / 100} credits</b>. You have {balance / 100}.</p>
      <FormError error={state?.error} />
      {enough ? <SubmitButton className="btn-ghost w-full border-accent text-accent">Reserve with credits</SubmitButton>
        : <p className="text-xs text-muted">Win credits in the <a href="/lottery" className="underline">giveaway draw</a>.</p>}
    </form>
  );
}
