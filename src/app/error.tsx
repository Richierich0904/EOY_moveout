"use client";

import Link from "next/link";

/** Shown instead of a crash screen when a page or an action fails. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid max-w-2xl gap-5 py-10">
      <p className="text-[11.5px] tracking-[.04em] text-muted">Something went wrong</p>
      <h1 className="text-[clamp(2.4rem,6vw,4.4rem)]">That didn&apos;t<br />work.</h1>
      <p className="sub">Nothing was lost. Try again, and if it keeps happening, tell an organiser what you were doing.</p>
      <div className="flex flex-wrap gap-2"><button onClick={reset} className="btn-primary">Try again</button><Link href="/" className="btn-ghost">Back to the start</Link></div>
    </div>
  );
}
