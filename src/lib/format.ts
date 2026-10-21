export function money(cents: number) {
  if (cents <= 0) return "Free";
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export function dollarsToCents(input: string | null | undefined) {
  const n = parseFloat((input ?? "").replace(/[^0-9.]/g, ""));
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function timeAgo(iso: string) {
  const t = new Date(iso.endsWith("Z") ? iso : iso.replace(" ", "T") + "Z").getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString();
}

export function classYear(gradYear: number) {
  return `'${String(gradYear).slice(-2)}`;
}
