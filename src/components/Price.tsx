/** Retail-style price: small superscript dollar sign and cents, big dollars. */
export function Price({ cents, size = "md", className = "" }: { cents: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const big = size === "lg" ? "text-[28px]" : size === "md" ? "text-[21px]" : "text-[16px]";
  const small = size === "lg" ? "text-[13px]" : size === "md" ? "text-[12px]" : "text-[10px]";
  if (cents <= 0) return <span className={`font-bold text-ok ${size === "sm" ? "text-[14px]" : "text-[18px]"} ${className}`}>FREE</span>;
  const dollars = Math.floor(cents / 100); const c = String(cents % 100).padStart(2, "0");
  return (
    <span className={`inline-flex items-start leading-none text-price ${className}`}>
      <span className={`${small} mt-[3px]`}>$</span>
      <span className={`${big} font-medium`}>{dollars}</span>
      <span className={`${small} mt-[3px]`}>{c}</span>
    </span>
  );
}
