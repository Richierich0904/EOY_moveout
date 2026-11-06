/** Prices set in the display face. Free items read as a moss "Free". */
export function Price({ cents, size = "md", className = "" }: { cents: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const cls = size === "lg" ? "text-[30px]" : size === "md" ? "text-[19px]" : "text-[16px]";
  if (cents <= 0) return <span className={`display font-medium text-moss-deep ${cls} ${className}`}>Free</span>;
  const v = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return <span className={`display font-medium tabular-nums text-fg ${cls} ${className}`}>${v}</span>;
}
