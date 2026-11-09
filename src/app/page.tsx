import Link from "next/link";
import { Suspense } from "react";
import { ListingCard } from "@/components/ListingCard";
import { SortSelect } from "@/components/SortSelect";
import { HeroPair } from "@/components/HeroPair";
import { Shelves } from "@/components/Shelves";
import { Icon } from "@/components/Icons";
import { CATEGORIES, SCHOOL_NAME, categoryLabel } from "@/lib/config";
import { categoryShelves, facetCounts, heroImages, searchListings } from "@/lib/listings";
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
  return s ? `/?${s}#browse` : "/#browse";
}

const PRICES: { label: string; min?: string; max?: string; free?: string }[] = [
  { label: "Free", free: "1" }, { label: "<$10", max: "9.99" }, { label: "$10–25", min: "10", max: "25" }, { label: "$25–50", min: "25", max: "50" }, { label: "$50+", min: "50" },
];

function season(d = new Date()) {
  const m = d.getMonth(); const y = d.getFullYear();
  return `${m <= 4 ? "Spring" : m <= 7 ? "Summer" : m <= 10 ? "Fall" : "Winter"} ${y}`;
}
function schoolYear(d = new Date()) {
  const y = d.getFullYear() % 100; const start = d.getMonth() >= 7 ? y : y - 1;
  return `${String(start).padStart(2, "0")}–${String(start + 1).padStart(2, "0")}`;
}
const isThisWeek = (iso: string) => Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime() < 7 * 86400_000;

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
  const newest = filtering ? [] : searchListings({ limit: 12 });
  const thisWeek = newest.filter((l) => isThisWeek(l.created_at));
  const row = thisWeek.length >= 4 ? thisWeek : newest.slice(0, 8);
  const wants = filtering ? [] : listWants().slice(0, 4);
  const draw = filtering ? null : currentDraw();
  const topPrize = draw ? prizesFor(draw.id)[0] : null;
  const counts = new Map(categoryShelves().map((s) => [s.category, s.count]));
  const facets = facetCounts();
  const priceOn = (r: (typeof PRICES)[number]) => (sp.free ?? "") === (r.free ?? "") && (sp.min ?? "") === (r.min ?? "") && (sp.max ?? "") === (r.max ?? "");
  const anyPrice = !sp.free && !sp.min && !sp.max;

  const filters = (
    <div className="grid gap-7">
      <section className="grid gap-3">
        <h3>Price</h3>
        <div className="flex flex-wrap gap-1.5">
          {PRICES.map((r) => <Link key={r.label} href={priceOn(r) ? qs(sp, { free: "", min: "", max: "" }) : qs(sp, { free: r.free ?? "", min: r.min ?? "", max: r.max ?? "" })} className={priceOn(r) ? "chip-on" : "chip"}>{r.label}</Link>)}
        </div>
      </section>
      <section className="grid gap-2.5 border-t border-line pt-5">
        <h3>Availability</h3>
        {[{ label: "Fall handoff", on: sp.fall === "1", href: qs(sp, { fall: sp.fall ? "" : "1" }), n: facets.fall }, { label: "Free to a good home", on: sp.free === "1", href: qs(sp, { free: sp.free ? "" : "1", min: "", max: "" }), n: facets.free }].map((f) => (
          <Link key={f.label} href={f.href} className="flex items-center gap-2.5 text-[12.5px] tracking-[.02em]">
            <span aria-hidden className={`flex h-4 w-4 items-center justify-center border ${f.on ? "border-fg bg-fg text-bg" : "border-line bg-card"}`}>{f.on && <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>}</span>
            {f.label} <span className="font-semibold text-accent tabular-nums">({f.n})</span>
          </Link>
        ))}
      </section>
      <section className="grid border-t border-line pt-5">
        <h3 className="mb-2">Category</h3>
        {CATEGORIES.map((c) => {
          const on = sp.category === c.slug;
          const n = counts.get(c.slug) ?? 0;
          if (n === 0 && !on) return <span key={c.slug} className="flex items-center justify-between border-b border-line py-2.5 text-[12.5px] tracking-[.02em] text-muted/60"><span>{c.label} <span className="tabular-nums">(0)</span></span></span>;
          return (
            <Link key={c.slug} href={qs(sp, { category: on ? "" : c.slug })} className={`flex items-center justify-between border-b border-line py-2.5 text-[12.5px] tracking-[.02em] transition hover:text-accent ${on ? "font-bold" : ""}`}>
              <span>{c.label} <span className="font-semibold text-accent tabular-nums">({n})</span></span><Icon name="right" size={13} />
            </Link>
          );
        })}
      </section>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-20 sm:gap-28">
      {!filtering && (
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
          <div className="rise flex flex-col gap-8">
            <nav aria-label="Departments" className="hidden gap-0.5 lg:grid">
              {CATEGORIES.slice(0, 5).map((c) => <Link key={c.slug} href={qs({}, { category: c.slug })} className="w-fit text-[12px] font-medium uppercase tracking-[.08em] transition hover:text-accent">{c.label}</Link>)}
            </nav>
            <form action="/" role="search" className="relative max-w-sm">
              <label htmlFor="home-q" className="sr-only">Search</label>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
              <input id="home-q" name="q" placeholder="Search" className="input pl-10 text-right" />
            </form>
            <div className="grid gap-3 lg:mt-auto">
              <h1 className="text-[clamp(2.6rem,6vw,4.4rem)]">End of year swap</h1>
              <p className="text-[13px] uppercase tracking-[.08em] text-muted">{SCHOOL_NAME}<br />{season()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="#browse" className="btn-ghost h-12 min-w-[200px] justify-between">Go to the shelves <Icon name="arrow" size={18} stroke={1.6} /></Link>
              {!user && <Link href="/signup" className="btn-primary h-12">Join with school email</Link>}
            </div>
          </div>
          <HeroPair pics={heroImages(6)} />
        </section>
      )}

      {draw && (
        <Link href="/lottery" className="reveal group flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-fg py-4 transition hover:bg-bg-deep">
          <span className="display text-[13px] uppercase tracking-[.04em]">Giveaway draw</span>
          <span className="text-[13.5px]"><b className="font-semibold">{draw.title}.</b> Give away 3 things, get a ticket.{topPrize ? ` First prize: ${topPrize.title}.` : ""}</span>
          <span className="more ml-auto">See prizes</span>
        </Link>
      )}

      {!filtering && row.length > 0 && (
        <section className="grid grid-cols-1 gap-8">
          <div className="reveal flex items-end justify-between gap-4">
            <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] leading-[.88]">{thisWeek.length >= 4 ? <>New<br />this week<span className="count ml-1">({thisWeek.length})</span></> : <>Just<br />listed<span className="count ml-1">({row.length})</span></>}</h2>
            <Link href="#browse" className="more">See all</Link>
          </div>
          <div className="reveal">
            <Shelves label="New this week">
              {row.map((l) => <div key={l.id} className="w-[min(62vw,250px)] shrink-0 snap-start"><ListingCard l={l} /></div>)}
            </Shelves>
          </div>
        </section>
      )}

      <section id="browse" className="grid scroll-mt-24 grid-cols-1 gap-8">
        {filtering ? (
          <div className="rise grid gap-5">
            <p className="text-[11.5px] tracking-[.04em] text-muted"><Link href="/" className="hover:text-fg">Home</Link> / <span className="text-fg">Products</span></p>
            <h1 className="text-[clamp(1.8rem,3.6vw,2.6rem)]">{sp.q ? <>Results for &ldquo;{sp.q}&rdquo;</> : sp.category ? categoryLabel(sp.category) : sp.free ? "Free to a good home" : sp.fall ? "Fall handoff" : "Products"}</h1>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center">
              <form action="/" role="search" className="relative">
                <label htmlFor="browse-q" className="sr-only">Search</label>
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={16} /></span>
                <input id="browse-q" name="q" defaultValue={sp.q} placeholder="Search" className="input pl-10 text-right" />
              </form>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                <Link href={qs(sp, { category: "", fall: "", free: "", min: "", max: "" })} className={!sp.category && !sp.fall && !sp.free && !sp.min && !sp.max ? "chip-on" : "chip"}>All</Link>
                {CATEGORIES.slice(0, 9).map((c) => <Link key={c.slug} href={qs(sp, { category: sp.category === c.slug ? "" : c.slug })} className={sp.category === c.slug ? "chip-on truncate" : "chip truncate"}><span className="sm:hidden">{c.label.split(" ")[0]}</span><span className="hidden sm:inline">{c.label}</span></Link>)}
              </div>
            </div>
          </div>
        ) : (
          <div className="reveal grid gap-6">
            <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] leading-[.88]">All on<br />campus<br />{schoolYear()}</h2>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div className="-mx-1 flex gap-5 overflow-x-auto px-1 text-[12.5px] tracking-[.03em] [scrollbar-width:none]">
                <Link href={qs(sp, { category: "" })} className="whitespace-nowrap font-semibold">(All)</Link>
                {CATEGORIES.map((c) => <Link key={c.slug} href={qs(sp, { category: c.slug })} className="whitespace-nowrap text-muted transition hover:text-fg">{c.label}</Link>)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
          <aside aria-label="Filters" className="hidden lg:block">
            <div className="sticky top-24 grid gap-6">
              <p className="display text-[13px] uppercase tracking-[.04em]">Filters</p>
              {filters}
            </div>
          </aside>

          <div className="grid min-w-0 content-start gap-6">
            <div className="flex flex-wrap items-center gap-3 border-b border-line pb-3">
              <details className="group w-full lg:hidden">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[12.5px] font-semibold uppercase tracking-[.08em] [&::-webkit-details-marker]:hidden">
                  Filters<span className="group-open:hidden">(+)</span><span className="hidden group-open:inline">(−)</span>
                </summary>
                <div className="pb-4 pt-5">{filters}</div>
              </details>
              <span className="whitespace-nowrap text-[12px] uppercase tracking-[.08em] text-muted">{listings.length} {listings.length === 1 ? "item" : "items"}</span>
              <span className="ml-auto flex items-center gap-2">
                {user && filtering && (
                  <form action={saveSearch}>
                    <input type="hidden" name="q" value={sp.q ?? ""} /><input type="hidden" name="category" value={sp.category ?? ""} />
                    {sp.free && <input type="hidden" name="free" value="1" />}{sp.max && <input type="hidden" name="max" value={sp.max} />}
                    <button className="chip">Alert me about new matches</button>
                  </form>
                )}
                {!anyPrice || sp.fall || sp.category ? <Link href={sp.q ? qs({ q: sp.q }, {}) : "/#browse"} className="chip">Clear</Link> : null}
                <Suspense><SortSelect value={sort} /></Suspense>
              </span>
            </div>

            {listings.length === 0 ? (
              <div className="card grid justify-items-start gap-3 p-8">
                <p className="display text-[20px] uppercase">Nothing here yet</p>
                <p className="max-w-md text-muted">{filtering ? "Try a wider search, or ask for an alert and we'll tell you the moment something like this is listed." : "Be the first to list something."}</p>
                <div className="mt-2 flex flex-wrap gap-2"><Link href="/listings/new" className="btn-primary">List an item</Link><Link href="/wanted/new" className="btn-ghost">Post a wanted ad</Link></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
                {listings.map((l, i) => <div key={l.id} className="reveal min-w-0" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}
              </div>
            )}
          </div>
        </div>
      </section>

      {wants.length > 0 && (
        <section className="grid grid-cols-1 gap-8">
          <div className="reveal flex items-end justify-between gap-4">
            <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] leading-[.88]">Wanted<span className="count ml-1">({wants.length})</span></h2>
            <Link href="/wanted" className="more">See all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {wants.map((w, i) => (
              <Link key={w.id} href={`/wanted/${w.id}`} className="card lift reveal grid content-start gap-2 p-5" style={{ ["--i" as string]: i }}>
                <span className="text-[11px] text-muted">{categoryLabel(w.category)}</span>
                <span className="display text-[17px] uppercase leading-tight">{w.title}</span>
                <span className="mt-2 flex items-baseline justify-between gap-2 text-[12px] text-muted"><span>{w.user_name.split(" ")[0]} · {w.user_house}</span><span className="font-semibold text-fg">{w.max_price_cents !== null ? `≤ ${money(w.max_price_cents)}` : "Any price"}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
