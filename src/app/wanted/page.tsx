import Link from "next/link";
import { listWants } from "@/lib/social";
import { categoryLabel } from "@/lib/config";
import { money, timeAgo } from "@/lib/format";
import { PageIntro } from "@/components/PageIntro";

export default async function WantedPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const wants = listWants({ q });
  return (
    <div className="mx-auto grid max-w-4xl gap-10">
      <PageIntro eyebrow="The wanted board" title="Ask, and somebody down the hall probably has it." sub="Post what you need. Anyone who lists a match gets nudged to message you.">
        <Link href="/wanted/new" className="btn-primary">Post a wanted ad</Link>
      </PageIntro>
      <form action="/wanted" role="search" className="reveal mx-auto w-full max-w-md">
        <label htmlFor="wanted-q" className="sr-only">Search wanted posts</label>
        <input id="wanted-q" name="q" defaultValue={q} placeholder="Search wanted posts…" className="input rounded-full" />
      </form>
      {wants.length === 0 ? (
        <p className="card p-10 text-center text-muted">No wanted posts{q ? ` for “${q}”` : ""} yet.</p>
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
