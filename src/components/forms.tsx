"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={className}>{pending ? "Working…" : children}</button>;
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p role="alert" className="rounded-[10px] border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-[14px] text-accent-deep">{error}</p>;
}
