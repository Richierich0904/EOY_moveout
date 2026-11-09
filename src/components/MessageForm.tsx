"use client";

import { startThread } from "@/actions/social";
import { FormError, SubmitButton, useKeptForm } from "./forms";

export function MessageForm({ listingId, wantId, placeholder, buttonLabel = "Send" }: { listingId?: number; wantId?: number; placeholder: string; buttonLabel?: string }) {
  const [state, onSubmit, pending] = useKeptForm(startThread);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {listingId && <input type="hidden" name="listing_id" value={listingId} />}
      {wantId && <input type="hidden" name="want_id" value={wantId} />}
      <label htmlFor={`msg-${listingId ?? wantId}`} className="sr-only">Your message</label>
      <textarea id={`msg-${listingId ?? wantId}`} name="body" rows={3} required maxLength={1000} placeholder={placeholder} className="input" />
      <FormError error={state?.error} />
      <SubmitButton pending={pending} className="btn-primary w-full">{buttonLabel}</SubmitButton>
    </form>
  );
}
