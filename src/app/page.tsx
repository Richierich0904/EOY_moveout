import Link from "next/link";
import { Suspense } from "react";
import { ListingCard, Thumb } from "@/components/ListingCard";
import { SortSelect } from "@/components/SortSelect";
import { HeroCollage } from "@/components/HeroCollage";
import { Shelves } from "@/components/Shelves";
import { CATEGORIES, SCHOOL_NAME, categoryLabel } from "@/lib/config";
import { categoryShelves, heroImages, searchListings } from "@/lib/listings";
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

const PRICE_RANGES: { label: string; min?: string; max?: string; free?: string }[] = [
  { label: "Any price" },
  { label: "Free", free: "1" },
  { label: "Under $10", max: "9.99" },
  { label: "$10–25", min: "10", max: "25" },
  { label: "$25–50", min: "25", max: "50" },
  { label: "$50+", min: "50" },
];

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
  const wants = filtering ? [] : listWants().slice(0, 3);
  const draw = filtering ? null : currentDraw();
  const topPrize = draw ? prizesFor(draw.id)[0] : null;
  const shelves = new Map(categoryShelves().map((s) => [s.category, s]));
  const totalLive = [...shelves.values()].reduce((a, s) => a + s.count, 0);
  const priceOn = (r: (typeof PRICE_RANGES)[number]) => (sp.free ?? "") === (r.free ?? "") && (sp.min ?? "") === (r.min ?? "") && (sp.max ?? "") === (r.max ?? "");
  const shelfCard = "card lift group flex w-[168px] shrink-0 snap-start flex-col gap-1 p-2.5 sm:w-[188px]";

  return (
    <div className="grid grid-cols-1 gap-14 sm:gap-20">
      {!filtering && (user ? (
        <section className="rise grid gap-2">
          <p className="eyebrow">{SCHOOL_NAME} · {totalLive} things looking for a home</p>
          <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
          <p className="sub max-w-xl">Search for what you need, or clear a shelf and give something away.</p>
        </section>
      ) : (
        <section className="-mt-2 overflow-hidden sm:-mt-4">
          <div className="intro rise">
            <p className="eyebrow">{SCHOOL_NAME} · the end-of-year swap</p>
            <h1 className="text-[clamp(2.6rem,7vw,5.4rem)] leading-[1.02]">Don&apos;t bin it. Swap it.</h1>
            <p className="sub max-w-[30em]">Buy, sell and give away the stuff in your room to people who live down the hall. Meet on campus, pay however you like, no shipping ever.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[17px]">
              <Link href="/signup" className="more">Join with your school email</Link>
              <Link href="#browse" className="more">Browse what&apos;s here</Link>
            </div>
          </div>
          <HeroCollage pics={heroImages(3)} />
        </section>
      ))}

      {draw && (
        <Link href="/lottery" className="card lift reveal group grid items-center gap-4 overflow-hidden p-5 sm:grid-cols-[auto_1fr_auto] sm:p-6">
          <span aria-hidden className="display flex h-14 w-14 items-center justify-center rounded-full bg-accent/12 text-[26px] text-accent">✦</span>
          <span className="grid gap-1">
            <span className="eyebrow">Giveaway draw</span>
            <span className="display text-[22px] leading-tight">{draw.title}</span>
            <span className="text-[14.5px] text-muted">Give away 3 things, get a ticket.{topPrize ? ` First prize: ${topPrize.title}.` : ""}</span>
          </span>
          <span className="more">See the prizes</span>
        </Link>
      )}

      <section id="browse" className="grid scroll-mt-20 grid-cols-1 gap-6">
        <div className="reveal flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1.5">
            <p className="eyebrow">The shelves</p>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">
              {sp.q ? <>Results for &ldquo;{sp.q}&rdquo;</> : sp.category ? categoryLabel(sp.category) : sp.free ? "Free to a good home" : sp.fall ? "Ready at fall move-in" : "Everything on campus"}
            </h2>
          </div>
          <form action="/" role="search" className="w-full md:hidden">
            <label htmlFor="home-q" className="sr-only">Search</label>
            <input id="home-q" name="q" defaultValue={sp.q} placeholder="Search mini fridge, MATH 301, lamp…" className="input rounded-full" />
          </form>
        </div>

        <div className="reveal">
          <Shelves label="Departments">
            <Link href={qs(sp, { category: "", free: "", fall: "", min: "", max: "" })} className={`${shelfCard} ${!filtering ? "ring-2 ring-fg" : ""}`}>
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[9px] bg-gradient-to-br from-accent/20 to-moss/20"><span className="display text-[34px]">All</span></div>
              <strong className="display mt-1.5 px-1 text-[17px] font-medium">Everything</strong>
              <span className="px-1 text-[12.5px] text-muted">{totalLive} available</span>
            </Link>
            <Link href={qs(sp, { free: sp.free ? "" : "1", min: "", max: "" })} className={`${shelfCard} ${sp.free ? "ring-2 ring-fg" : ""}`}>
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[9px] bg-moss/20"><span className="display text-[30px] text-moss-deep">Free</span></div>
              <strong className="display mt-1.5 px-1 text-[17px] font-medium">Free pile</strong>
              <span className="px-1 text-[12.5px] text-muted">Counts toward the draw</span>
            </Link>
            <Link href={qs(sp, { fall: sp.fall ? "" : "1" })} className={`${shelfCard} ${sp.fall ? "ring-2 ring-fg" : ""}`}>
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[9px] bg-accent/15"><span className="display text-[24px] text-accent-deep">September</span></div>
              <strong className="display mt-1.5 px-1 text-[17px] font-medium">Fall handoff</strong>
              <span className="px-1 text-[12.5px] text-muted">Claim now, collect at move-in</span>
            </Link>
            {CATEGORIES.map((c) => {
              const s = shelves.get(c.slug);
              const on = sp.category === c.slug;
              return (
                <Link key={c.slug} href={qs(sp, { category: on ? "" : c.slug })} className={`${shelfCard} ${on ? "ring-2 ring-fg" : ""}`}>
                  <div className="aspect-[4/3] overflow-hidden rounded-[9px] bg-bg"><Thumb src={s?.image ?? null} alt={c.label} /></div>
                  <strong className="display mt-1.5 px-1 text-[17px] font-medium">{c.label}</strong>
                  <span className="px-1 text-[12.5px] text-muted">{s ? `${s.count} available` : "Nothing yet"}</span>
                </Link>
              );
            })}
          </Shelves>
        </div>

        <div className="reveal flex flex-wrap items-center gap-2">
          <div className="-mx-[max(16px,env(safe-area-inset-left,0px))] flex gap-2 overflow-x-auto px-[max(16px,env(safe-area-inset-left,0px))] py-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {PRICE_RANGES.map((r) => (
              <Link key={r.label} href={qs(sp, { free: r.free ?? "", min: r.min ?? "", max: r.max ?? "" })} className={priceOn(r) ? "chip-on" : "chip"}>{r.label}</Link>
            ))}
          </div>
          <span className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <span className="whitespace-nowrap text-[14px] text-muted">{listings.length} {listings.length === 1 ? "item" : "items"}</span>
            <span className="ml-auto flex items-center gap-2 sm:ml-2">
              {user && filtering && (
                <form action={saveSearch}>
                  <input type="hidden" name="q" value={sp.q ?? ""} /><input type="hidden" name="category" value={sp.category ?? ""} />
                  {sp.free && <input type="hidden" name="free" value="1" />}{sp.max && <input type="hidden" name="max" value={sp.max} />}
                  <button className="chip">Alert me about new matches</button>
                </form>
              )}
              <Suspense><SortSelect value={sort} /></Suspense>
            </span>
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="card reveal grid justify-items-center gap-3 px-6 py-14 text-center">
            <p className="display text-[24px]">Nothing on this shelf yet.</p>
            <p className="max-w-md text-muted">{filtering ? "Try a wider search, or ask for an alert and we'll tell you the moment something like this is listed." : "Be the first to list something."}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2"><Link href="/listings/new" className="btn-primary">List an item</Link><Link href="/wanted/new" className="btn-ghost">Post a wanted ad</Link></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {listings.map((l, i) => <div key={l.id} className="reveal" style={{ ["--i" as string]: i % 4 }}><ListingCard l={l} /></div>)}
          </div>
        )}
      </section>

      {wants.length > 0 && (
        <section className="grid grid-cols-1 gap-6">
          <div className="intro reveal">
            <p className="eyebrow">The wanted board</p>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">People down the hall are looking for…</h2>
            <p className="sub">Got one of these in your room? Message them and it&apos;s gone by dinner.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
            {wants.map((w, i) => (
              <Link key={w.id} href={`/wanted/${w.id}`} className="card lift reveal grid gap-2 p-5" style={{ ["--i" as string]: i }}>
                <span className="text-[12.5px] font-semibold uppercase tracking-[.1em] text-muted">{categoryLabel(w.category)}</span>
                <span className="display text-[21px] leading-snug">{w.title}</span>
                <span className="text-[14px] text-muted">{w.user_name.split(" ")[0]}, {w.user_house} · {w.max_price_cents !== null ? `up to ${money(w.max_price_cents)}` : "any price"}</span>
              </Link>
            ))}
          </div>
          <div className="reveal text-center"><Link href="/wanted" className="more text-[17px]">See every wanted post</Link></div>
        </section>
      )}
    </div>
  );
}
