import Link from "next/link";
import { classYear } from "@/lib/format";

export function Who({ id, name, house, gradYear, small }: { id: number; name: string; house: string; gradYear: number; small?: boolean }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link href={`/u/${id}`} className="flex items-center gap-2">
      <span className={`flex ${small ? "h-7 w-7 text-xs" : "h-10 w-10 text-sm"} items-center justify-center rounded-full bg-subheader font-bold text-white`}>{initials}</span>
      <span className="leading-tight">
        <span className="block font-medium">{name}</span>
        <span className="block text-[12px] text-muted">{house} · Class of {classYear(gradYear)}</span>
      </span>
    </Link>
  );
}
