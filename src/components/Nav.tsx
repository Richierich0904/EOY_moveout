import Link from "next/link";
import { APP_NAME, CATEGORIES } from "@/lib/config";

type Props = {
  user: { name: string; house: string; verified: boolean; credits: number; isAdmin: boolean } | null;
  counts: { notifications: number; messages: number };
  q?: string; category?: string;
};

function Badge({ n, className = "" }: { n: number; className?: string }) {
  if (!n) return null;
  return <span className={`inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold leading-[18px] text-white ${className}`}>{n > 9 ? "9+" : n}</span>;
}

function SearchBar({ q, category }: { q?: string; category?: string }) {
  return (
    <form action="/" className="flex h-10 w-full overflow-hidden rounded-md bg-white focus-within:ring-[3px] focus-within:ring-accent">
      <select name="category" defaultValue={category ?? ""} aria-label="Category" className="hidden max-w-[150px] border-r border-line bg-[#f3f3f3] px-2 text-[12px] text-muted outline-none sm:block">
        <option value="">All</option>
        {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
      </select>
      <input name="q" defaultValue={q} placeholder={`Search ${APP_NAME}`} className="min-w-0 flex-1 px-3 text-[15px] text-fg outline-none" />
      <button aria-label="Search" className="w-11 bg-[#febd69] text-xl hover:bg-accent">🔍</button>
    </form>
  );
}

export function Nav({ user, counts, q, category }: Props) {
  const first = user?.name.split(" ")[0];
  return (
    <>
      <header className="sticky top-0 z-20 text-white">
        {/* Top bar */}
        <div className="bg-header">
          <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-1.5 sm:gap-3">
            <Link href="/" className="rounded-sm border border-transparent px-1 py-1 text-[22px] font-black tracking-tight hover:border-white">{APP_NAME}<span className="text-accent">.</span></Link>
            {user && (
              <Link href="/me" className="hidden items-end gap-0.5 rounded-sm border border-transparent px-1 py-1 leading-tight hover:border-white md:flex">
                <span className="text-lg">📍</span>
                <span><span className="block text-[12px] text-[#ccc]">Pick up in</span><span className="block text-[14px] font-bold">{user.house}</span></span>
              </Link>
            )}
            <div className="hidden flex-1 sm:block"><SearchBar q={q} category={category} /></div>
            <nav className="ml-auto flex items-center gap-1 sm:gap-2">
              {user ? (
                <>
                  <Link href="/me" className="rounded-sm border border-transparent px-1.5 py-1 leading-tight hover:border-white">
                    <span className="block text-[12px]">Hello, {first}</span>
                    <span className="block text-[14px] font-bold">Account & Lists{user.credits > 0 && <span className="ml-1 font-normal text-[#febd69]">⭐{user.credits / 100}</span>}</span>
                  </Link>
                  <Link href="/alerts" className="hidden rounded-sm border border-transparent px-1.5 py-1 leading-tight hover:border-white md:block">
                    <span className="block text-[12px]">Alerts <Badge n={counts.notifications} /></span>
                    <span className="block text-[14px] font-bold">& Saved searches</span>
                  </Link>
                  <Link href="/messages" className="relative rounded-sm border border-transparent px-1.5 py-1 hover:border-white">
                    <span className="flex items-end gap-1"><span className="text-2xl">💬</span><span className="hidden text-[14px] font-bold md:inline">Messages</span></span>
                    <Badge n={counts.messages} className="absolute -top-0.5 left-6" />
                  </Link>
                  <Link href="/listings/new" className="btn-primary hidden md:inline-flex">Sell</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-sm border border-transparent px-1.5 py-1 leading-tight hover:border-white">
                    <span className="block text-[12px]">Hello, sign in</span>
                    <span className="block text-[14px] font-bold">Account & Lists</span>
                  </Link>
                  <Link href="/signup" className="btn-primary">Join</Link>
                </>
              )}
            </nav>
          </div>
          <div className="px-3 pb-2 sm:hidden"><SearchBar q={q} category={category} /></div>
        </div>
        {/* Secondary bar */}
        <div className="bg-subheader">
          <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-3 text-[14px] [scrollbar-width:none]">
            <Link href="/" className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 font-bold hover:border-white">☰ All</Link>
            <Link href="/?free=1" className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white">Free stuff</Link>
            <Link href="/?fall=1" className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white">Fall handoff</Link>
            <Link href="/wanted" className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white">Wanted</Link>
            <Link href="/lottery" className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white">Giveaway draw</Link>
            <Link href="/impact" className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white">Impact</Link>
            {CATEGORIES.map((c) => <Link key={c.slug} href={`/?category=${c.slug}`} className="hidden whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white lg:block">{c.label}</Link>)}
            {user?.isAdmin && <Link href="/admin" className="ml-auto whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 text-[#febd69] hover:border-white">Organisers</Link>}
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card text-[11px] sm:hidden">
        <Link href="/" className="flex flex-col items-center py-1.5"><span className="text-xl">🏠</span>Home</Link>
        <Link href="/wanted" className="flex flex-col items-center py-1.5"><span className="text-xl">🙋</span>Wanted</Link>
        <Link href="/listings/new" className="flex flex-col items-center py-1.5 font-bold"><span className="rounded-full bg-cta px-3 text-xl">+</span>Sell</Link>
        <Link href="/lottery" className="flex flex-col items-center py-1.5"><span className="text-xl">🎟️</span>Draw</Link>
        <Link href={user ? "/me" : "/login"} className="relative flex flex-col items-center py-1.5"><span className="text-xl">👤</span>{user ? "You" : "Sign in"}<Badge n={counts.notifications + counts.messages} className="absolute right-5 top-0" /></Link>
      </nav>
    </>
  );
}
