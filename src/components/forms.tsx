"use client";

import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";

/** Like useActionState, but the form keeps what was typed when the server says no.
 *  (A plain form action clears every field after each attempt, photos included.)
 *  Use as: const [state, onSubmit, pending] = useKeptForm(action); <form onSubmit={onSubmit}> */
export function useKeptForm<S>(action: (prev: Awaited<S> | undefined, fd: FormData) => Promise<S | undefined>) {
  const [state, dispatch, pending] = useActionState<S | undefined, FormData>(action as never, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}

export function SubmitButton({ children, className = "btn-primary", pending }: { children: React.ReactNode; className?: string; pending?: boolean }) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return <button type="submit" disabled={busy} className={className}>{busy ? "Working…" : children}</button>;
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p role="alert" className="border border-fg bg-card px-3.5 py-2.5 text-[13px] text-fg">{error}</p>;
}

/** A quiet confirmation after a form worked. */
export function FormNote({ note }: { note?: string }) {
  if (!note) return null;
  return <p role="status" className="bg-bg-deep px-3.5 py-2.5 text-[13px] text-fg">{note}</p>;
}
