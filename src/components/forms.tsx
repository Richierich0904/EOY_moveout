"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={className}>{pending ? "Working…" : children}</button>;
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p role="alert" className="rounded-lg border border-free/40 bg-free/10 px-3 py-2 text-sm text-free">{error}</p>;
}
