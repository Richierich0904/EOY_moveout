/** Centred section opener used at the top of every page: eyebrow, display headline, one-line sub. */
export function PageIntro({ eyebrow, title, sub, children, align = "center" }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; align?: "center" | "left" }) {
  return (
    <header className={`rise grid gap-2.5 ${align === "center" ? "intro" : ""}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {sub && <p className="sub max-w-[32em]">{sub}</p>}
      {children && <div className={`mt-2 flex flex-wrap gap-2 ${align === "center" ? "justify-center" : ""}`}>{children}</div>}
    </header>
  );
}
