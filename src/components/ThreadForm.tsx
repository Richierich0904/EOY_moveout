"use client";

import { useEffect, useRef } from "react";
import { sendMessage } from "@/actions/social";
import { FormError, SubmitButton, useKeptForm } from "./forms";

/** The reply box at the bottom of a chat. Clears itself once the message is sent. */
export function ThreadForm({ threadId }: { threadId: number }) {
  const [state, onSubmit, pending] = useKeptForm(sendMessage);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  return (
    <form ref={form} onSubmit={onSubmit} className="sticky bottom-[calc(64px+env(safe-area-inset-bottom,0px))] grid gap-2 bg-bg/90 py-2 backdrop-blur sm:bottom-0">
      <div className="flex gap-2">
        <input type="hidden" name="thread_id" value={threadId} />
        <label htmlFor="thread-body" className="sr-only">Message</label>
        <input id="thread-body" name="body" required maxLength={1000} autoComplete="off" placeholder="Write a message…" className="input" />
        <SubmitButton pending={pending}>Send</SubmitButton>
      </div>
      <FormError error={state?.error} />
    </form>
  );
}
