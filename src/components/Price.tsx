/** Plain prices in the interface face. Free items read "Free" (shown in capitals). */
export function Price({ cents, size = "md", className = "" }: { cents: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const cls = size === "lg" ? "text-[24px] font-bold [font-stretch:115%]" : size === "md" ? "text-[15px] font-semibold" : "text-[13px] font-semibold";
  if (cents <= 0) return <span className={`uppercase tracking-[.04em] tabular-nums ${cls} ${className}`}>Free</span>;
  const v = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return <span className={`tabular-nums ${cls} ${className}`}>${v}</span>;
}
