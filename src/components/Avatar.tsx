import Link from "next/link";
import { classLabel } from "@/lib/format";

/** A round profile photo, or the person's initials on black when they haven't added one. */
export function Face({ name, avatar, size = 40, className = "" }: { name: string; avatar?: string | null; size?: number; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) };
  if (avatar) return <img src={`/uploads/${avatar}`} alt="" style={style} className={`shrink-0 rounded-full bg-bg-deep object-cover ${className}`} />;
  return <span aria-hidden style={style} className={`flex shrink-0 items-center justify-center rounded-full bg-fg font-semibold text-bg ${className}`}>{initials}</span>;
}

export function Who({ id, name, house, gradYear, avatar, small }: { id: number; name: string; house: string; gradYear: number; avatar?: string | null; small?: boolean }) {
  return (
    <Link href={`/u/${id}`} className="flex items-center gap-2.5">
      <Face name={name} avatar={avatar} size={small ? 28 : 40} />
      <span className="leading-tight">
        <span className="block font-semibold">{name}</span>
        <span className="block text-[11.5px] text-muted">{house} · {classLabel(gradYear)}</span>
      </span>
    </Link>
  );
}
