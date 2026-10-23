import Link from "next/link";
import { Suspense } from "react";
import { ListingCard } from "@/components/ListingCard";
import { SortSelect } from "@/components/SortSelect";
import { CATEGORIES, SCHOOL_NAME, categoryLabel } from "@/lib/config";
import { searchListings } from "@/lib/listings";
import { listWants } from "@/lib/social";
import { getCurrentUser } from "@/lib/auth";
import { saveSearch } from "@/actions/social";
import { money } from "@/lib/format";
import { currentDraw, prizesFor } from "@/lib/game";

type SP = { q?: string; category?: string; free?: string; fall?: string; sort?: string; max?: string; min?: string };

function qs(sp: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

const PRICE_RANGES: { label: string; min?: string; max?: string; free?: string }[] = [
  { label: "Free", free: "1" },
  { label: "Under $10", max: "9.99" },
  { label: "$10 to $25", min: "10", max: "25" },
  { label: "$25 to $50", min: "25", max: "50" },
  { label: "$50 & above", min: "50" },
];

function SideLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`block py-[3px] text-[14px] hover:text-link-hover ${on ? "font-bold" : ""}`}>{on ? "✓ " : ""}{children}</Link>;
}

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const sort = (sp.sort as "new" | "cheap" | "pricey") ?? "new";
  const listings = searchListings({
    q: sp.q, category: sp.category, free: sp.free === "1", fall: sp.fall === "1", sort,
    maxPrice: sp.max ? Math.round(parseFloat(sp.max) * 100) : undefined,
    minPrice: sp.min ? Math.round(parseFloat(sp.min) * 100) : undefined,
  });
  const filtering = !!(sp.q || sp.category || sp.free || sp.fall || sp.max || sp.min);
  const wants = filtering ? [] : listWants().slice(0, 4);
  const draw = filtering ? null : currentDraw();
  const topPrize = draw ? prizesFor(draw.id)[0] : null;
  const priceOn = (r: (typeof PRICE_RANGES)[number]) => (sp.free ?? "") === (r.free ?? "") && (sp.min ?? "") === (r.min ?? "") && (sp.max ?? "") === (r.max ?? "");

  return (
    <div className="space-y-3">
      {!user && !filtering && (
        <section className="relative overflow-hidden rounded-lg bg-gradient-to-r from-subheader to-header px-5 py-7 text-white sm:px-8">
          <h1 className="text-[26px] font-black leading-tight sm:text-[32px]">Don&apos;t bin it. Swap it.</h1>
          <p className="mt-1 max-w-xl text-[15px] text-[#ddd]">Buy, sell and give away stuff with other {SCHOOL_NAME} students. Meet on campus, pay however you like, no shipping ever.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link href="/signup" className="btn-primary">Join with school email</Link><Link href="/wanted" className="btn-ghost">See what people want</Link></div>
        </section>
      )}
      {draw && (
        <Link href="/lottery" className="card flex items-center gap-3 border-l-4 border-l-accent px-4 py-2.5 text-[14px] hover:bg-[#fffbf3]">
          <span className="text-2xl">🎟️</span>
          <span><b>{draw.title}</b> is on. Give away 3 things, get a ticket.{topPrize ? ` First prize: ${topPrize.title}.` : ""}</span>
          <span className="a-link ml-auto hidden whitespace-nowrap sm:inline">See prizes ›</span>
        </Link>
      )}

      <div className="flex gap-4">
        {/* Sidebar filters */}
        <aside className="hidden w-[200px] shrink-0 lg:block">
          <div className="sticky top-[92px] space-y-4 text-[14px]">
            <div>
              <h3 className="mb-1 font-bold">Department</h3>
              <SideLink href={qs(sp, { category: "" })} on={!sp.category}>Any department</SideLink>
              {CATEGORIES.map((c) => <SideLink key={c.slug} href={qs(sp, { category: c.slug })} on={sp.category === c.slug}>{c.label}</SideLink>)}
            </div>
            <div>
              <h3 className="mb-1 font-bold">Price</h3>
              <SideLink href={qs(sp, { free: "", min: "", max: "" })} on={!sp.free && !sp.min && !sp.max}>Any price</SideLink>
              {PRICE_RANGES.map((r) => <SideLink key={r.label} href={qs(sp, { free: r.free ?? "", min: r.min ?? "", max: r.max ?? "" })} on={priceOn(r)}>{r.label}</SideLink>)}
            </div>
            <div>
              <h3 className="mb-1 font-bold">Handoff</h3>
              <SideLink href={qs(sp, { fall: "" })} on={!sp.fall}>Any time</SideLink>
              <SideLink href={qs(sp, { fall: "1" })} on={sp.fall === "1"}>🍂 Fall handoff only</SideLink>
            </div>
            {user && filtering && (
              <form action={saveSearch}>
                <input type="hidden" name="q" value={sp.q ?? ""} /><input type="hidden" name="category" value={sp.category ?? ""} />
                {sp.free && <input type="hidden" name="free" value="1" />}{sp.max && <input type="hidden" name="max" value={sp.max} />}
                <button className="btn-ghost w-full text-[13px]">🔔 Alert me about new matches</button>
              </form>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-3">
          {/* Mobile filter chips */}
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:hidden [scrollbar-width:none]">
            <Link href={qs(sp, { category: "", free: "", fall: "", min: "", max: "" })} className={!filtering ? "chip-on" : "chip"}>All</Link>
            <Link href={qs(sp, { free: sp.free ? "" : "1", min: "", max: "" })} className={sp.free ? "chip-on" : "chip"}>Free</Link>
            <Link href={qs(sp, { fall: sp.fall ? "" : "1" })} className={sp.fall ? "chip-on" : "chip"}>Fall handoff</Link>
            {CATEGORIES.map((c) => <Link key={c.slug} href={qs(sp, { category: sp.category === c.slug ? "" : c.slug })} className={sp.category === c.slug ? "chip-on" : "chip"}>{c.label}</Link>)}
          </div>

          <div className="card flex flex-wrap items-center gap-2 px-3 py-2 text-[14px]">
            <span>
              {listings.length === 0 ? "No results" : `1-${listings.length} of ${listings.length} results`}
              {sp.q && <> for <span className="font-bold text-price">&quot;{sp.q}&quot;</span></>}
              {sp.category && <> in <span className="font-bold">{categoryLabel(sp.category)}</span></>}
            </span>
            <span className="ml-auto flex items-center gap-2">
              {user && filtering && (
                <form action={saveSearch} className="lg:hidden">
                  <input type="hidden" name="q" value={sp.q ?? ""} /><input type="hidden" name="category" value={sp.category ?? ""} />
                  {sp.free && <input type="hidden" name="free" value="1" />}{sp.max && <input type="hidden" name="max" value={sp.max} />}
                  <button className="chip">🔔 Alert me</button>
                </form>
              )}
              <Suspense><SortSelect value={sort} /></Suspense>
            </span>
          </div>

          {wants.length > 0 && (
            <section className="card p-3">
              <div className="mb-2 flex items-baseline justify-between"><h2 className="text-[16px]">People are looking for</h2><Link href="/wanted" className="a-link text-[13px]">See all wanted posts ›</Link></div>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {wants.map((w) => (
                  <li key={w.id}><Link href={`/wanted/${w.id}`} className="block rounded-md border border-line p-2.5 hover:bg-[#f7fafa]">
                    <div className="truncate text-[14px] font-medium">🙋 {w.title}</div>
                    <div className="text-[12px] text-muted">{w.user_name} · {w.max_price_cents !== null ? `up to ${money(w.max_price_cents)}` : "any price"}</div>
                  </Link></li>
                ))}
              </ul>
            </section>
          )}

          {listings.length === 0 ? (
            <div className="card p-10 text-center text-muted">
              <p className="text-[16px]">No results{sp.q ? ` for "${sp.q}"` : ""}.</p>
              <p className="mt-1 text-[13px]">{filtering ? "Try fewer filters, or save this search and we'll tell you when something shows up." : "Be the first to list something."}</p>
              <div className="mt-4 flex justify-center gap-2"><Link href="/listings/new" className="btn-primary">List an item</Link><Link href="/wanted/new" className="btn-ghost">Post a wanted ad</Link></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
