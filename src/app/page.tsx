import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES, SCHOOL_NAME } from "@/lib/config";
import { searchListings } from "@/lib/listings";
import { listWants } from "@/lib/social";
import { getCurrentUser } from "@/lib/auth";
import { saveSearch } from "@/actions/social";
import { money } from "@/lib/format";

type SP = { q?: string; category?: string; free?: string; fall?: string; sort?: string; max?: string };

function qs(sp: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const listings = searchListings({
    q: sp.q, category: sp.category, free: sp.free === "1", fall: sp.fall === "1",
    sort: (sp.sort as "new" | "cheap" | "pricey") ?? "new",
    maxPrice: sp.max ? Math.round(parseFloat(sp.max) * 100) : undefined,
  });
  const filtering = !!(sp.q || sp.category || sp.free || sp.fall || sp.max);
  const wants = filtering ? [] : listWants().slice(0, 4);

  return (
    <div className="space-y-5">
      {!user && (
        <section className="rounded-2xl bg-accent px-5 py-6 text-accent-fg sm:px-8">
          <h1 className="text-2xl font-black sm:text-3xl">Don&apos;t bin it. Swap it.</h1>
          <p className="mt-1 max-w-xl opacity-90">Buy, sell and give away stuff with other {SCHOOL_NAME} students. Meet on campus, pay however you like, no shipping ever.</p>
          <div className="mt-4 flex gap-2"><Link href="/signup" className="btn bg-white text-accent">Join with school email</Link><Link href="/wanted" className="btn border border-white/40">See what people want</Link></div>
        </section>
      )}

      <form action="/" className="sm:hidden"><input name="q" defaultValue={sp.q} placeholder="Search anything…" className="input" /></form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={qs(sp, { category: "", free: "", fall: "" })} className={!sp.category && !sp.free && !sp.fall ? "chip-on" : "chip"}>All</Link>
        <Link href={qs(sp, { free: sp.free ? "" : "1" })} className={sp.free ? "chip-on" : "chip"}>🎁 Free</Link>
        <Link href={qs(sp, { fall: sp.fall ? "" : "1" })} className={sp.fall ? "chip-on" : "chip"}>🍂 Fall handoff</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={qs(sp, { category: sp.category === c.slug ? "" : c.slug })} className={sp.category === c.slug ? "chip-on" : "chip"}>{c.label}</Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{listings.length} {listings.length === 1 ? "item" : "items"}{sp.q ? ` for “${sp.q}”` : ""}</span>
        <span className="ml-auto flex gap-1">
          {(["new", "cheap", "pricey"] as const).map((s) => (
            <Link key={s} href={qs(sp, { sort: s })} className={(sp.sort ?? "new") === s ? "chip-on" : "chip"}>{s === "new" ? "Newest" : s === "cheap" ? "Price ↑" : "Price ↓"}</Link>
          ))}
        </span>
        {user && filtering && (
          <form action={saveSearch} className="contents">
            <input type="hidden" name="q" value={sp.q ?? ""} /><input type="hidden" name="category" value={sp.category ?? ""} />
            {sp.free && <input type="hidden" name="free" value="1" />}{sp.max && <input type="hidden" name="max" value={sp.max} />}
            <button className="chip hover:border-accent">🔔 Alert me when something like this is listed</button>
          </form>
        )}
      </div>

      {wants.length > 0 && (
        <section className="rounded-xl border border-dashed border-line p-3">
          <div className="mb-2 flex items-baseline justify-between"><h2 className="font-bold">People are looking for</h2><Link href="/wanted" className="text-sm text-accent">All wanted posts →</Link></div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {wants.map((w) => (
              <li key={w.id}><Link href={`/wanted/${w.id}`} className="block rounded-lg bg-card p-3 hover:shadow-sm">
                <div className="truncate font-medium">🙋 {w.title}</div>
                <div className="text-xs text-muted">{w.user_name} · {w.max_price_cents !== null ? `up to ${money(w.max_price_cents)}` : "any price"}</div>
              </Link></li>
            ))}
          </ul>
        </section>
      )}

      {listings.length === 0 ? (
        <div className="rounded-xl border border-line bg-card p-10 text-center text-muted">
          <p className="text-lg">Nothing here yet.</p>
          <p className="mt-1 text-sm">{filtering ? "Try fewer filters, or save this search and we'll tell you when something shows up." : "Be the first to list something."}</p>
          <div className="mt-4 flex justify-center gap-2"><Link href="/listings/new" className="btn-primary">List an item</Link><Link href="/wanted/new" className="btn-ghost">Post a wanted ad</Link></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      )}
    </div>
  );
}
