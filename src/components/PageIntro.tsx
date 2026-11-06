/** Page opener after the reference: a small breadcrumb-style line, then a heavy uppercase title. */
export function PageIntro({ eyebrow, title, sub, children }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; align?: "center" | "left" }) {
  return (
    <header className="rise grid justify-items-start gap-3">
      {eyebrow && <p className="text-[11.5px] tracking-[.04em] text-muted">{eyebrow}</p>}
      <h1>{title}</h1>
      {sub && <p className="sub max-w-[36em]">{sub}</p>}
      {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
