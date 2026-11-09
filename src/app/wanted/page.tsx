import Link from "next/link";
import { listWants } from "@/lib/social";
import { requireViewer } from "@/lib/auth";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { PageIntro } from "@/components/PageIntro";
import { Icon } from "@/components/Icons";

export const metadata = { title: "Wanted" };

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireViewer();
  const { q } = await searchParams;
  const wants = listWants({ q, viewerId: user.id });
  return (
    <div className="grid gap-10">
      <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PageIntro eyebrow="The wanted board" title="Ask, and somebody down the hall probably has it." sub="Post what you need. You get an alert the moment someone lists a match.">
          <Link href="/wanted/new" className="btn-primary">Post a wanted ad</Link>
        </PageIntro>
        <form action="/wanted" role="search" className="rise relative">
          <label htmlFor="wanted-q" className="sr-only">Search wanted posts</label>
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
          <input id="wanted-q" name="q" defaultValue={q} maxLength={80} placeholder="Search" className="input pl-10 text-right" />
        </form>
      </div>
      {wants.length === 0 ? (
        <p className="card p-10 text-muted">No wanted posts{q ? ` for “${q}”` : ""} yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {wants.map((w, i) => (
            <Link key={w.id} href={`/wanted/${w.id}`} className="card lift reveal grid gap-2 p-5" style={{ ["--i" as string]: i % 2 }}>
              <span className="flex items-center justify-between gap-2 text-[12.5px] font-semibold uppercase tracking-[.1em] text-muted">
                <span>{categoryLabel(w.category)}</span><span className="normal-case tracking-normal">{timeAgo(w.created_at)}</span>
              </span>
              <span className="display text-[22px] leading-snug">{w.title}</span>
              <span className="flex items-baseline justify-between gap-2 text-[14px] text-muted">
                <span>{w.user_name.split(" ")[0]}, {w.user_house}</span>
                <span className="display text-[17px] text-fg">{w.max_price_cents !== null ? `up to ${money(w.max_price_cents)}` : "any price"}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
