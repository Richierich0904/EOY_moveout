import Link from "next/link";
import { listWants } from "@/lib/social";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const wants = listWants({ q });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1 className="text-2xl font-bold">Wanted</h1><p className="text-[13px] text-muted">Looking for something? Say so. Sellers get pinged when they list a match.</p></div>
        <Link href="/wanted/new" className="btn-primary">+ Post a wanted ad</Link>
      </div>
      <form action="/wanted"><input name="q" defaultValue={q} placeholder="Search wanted posts…" className="input" /></form>
      {wants.length === 0 ? (
        <p className="rounded-lg border border-line bg-card p-8 text-center text-muted">No wanted posts{q ? ` for “${q}”` : ""} yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
          {wants.map((w) => (
            <li key={w.id}><Link href={`/wanted/${w.id}`} className="flex items-center gap-3 p-4 hover:bg-bg">
              <span className="text-2xl">🙋</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{w.title}</span>
                <span className="block text-[12px] text-muted">{categoryLabel(w.category)} · {w.user_name}, {w.user_house} · {timeAgo(w.created_at)}</span>
              </span>
              <span className="shrink-0 text-sm font-bold">{w.max_price_cents !== null ? `≤ ${money(w.max_price_cents)}` : "Any price"}</span>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
