"use client";

import { useActionState } from "react";
import { payWithCredits } from "@/actions/game";
import { FormError, SubmitButton } from "./forms";

export function CreditPay({ listingId, priceCents, balance }: { listingId: number; priceCents: number; balance: number }) {
  const [state, action] = useActionState(payWithCredits, undefined);
  const enough = balance >= priceCents;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={listingId} />
      <p className="text-[13px]">⭐ Takes <b>{priceCents / 100} credits</b>. You have {balance / 100}.</p>
      <FormError error={state?.error} />
      {enough ? <SubmitButton className="btn-orange w-full">Reserve with credits</SubmitButton>
        : <p className="text-[12px] text-muted">Win credits in the <a href="/lottery" className="underline">giveaway draw</a>.</p>}
    </form>
  );
}
