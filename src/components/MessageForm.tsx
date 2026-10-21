"use client";

import { useActionState } from "react";
import { startThread } from "@/actions/social";
import { FormError, SubmitButton } from "./forms";

export function MessageForm({ listingId, wantId, placeholder }: { listingId?: number; wantId?: number; placeholder: string }) {
  const [state, action] = useActionState(startThread, undefined);
  return (
    <form action={action} className="space-y-2">
      {listingId && <input type="hidden" name="listing_id" value={listingId} />}
      {wantId && <input type="hidden" name="want_id" value={wantId} />}
      <textarea name="body" rows={3} required placeholder={placeholder} className="input" />
      <FormError error={state?.error} />
      <SubmitButton>Send</SubmitButton>
    </form>
  );
}
