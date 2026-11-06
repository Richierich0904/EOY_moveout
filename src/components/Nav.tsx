import Link from "next/link";
import { TabBar } from "./TabBar";

type Props = {
  appName: string;
  user: { name: string; credits: number; isAdmin: boolean } | null;
  counts: { notifications: number; messages: number };
};

function Dot({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-1 inline-flex min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[17px] text-white">{n > 9 ? "9+" : n}</span>;
}

const navLink = "rounded-full px-2.5 py-1.5 text-[13.5px] font-medium text-fg/80 transition-colors hover:text-fg";

export function Nav({ appName, user, counts }: Props) {
  const first = user?.name.split(" ")[0];
  return (
    <>
      <header id="site-nav"
        className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-line/70 bg-[var(--nav)] backdrop-blur-xl backdrop-saturate-150 transition-transform duration-500 ease-[cubic-bezier(.25,.1,.25,1)] data-[hidden]:-translate-y-full">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center gap-3 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
          <Link href="/" className="display flex shrink-0 items-center gap-2 text-[20px] font-semibold">
            <span aria-hidden className="h-3 w-3 rounded-full bg-accent shadow-[inset_-3px_-3px_0_var(--terracotta-deep)]" />{appName}
          </Link>
          <form action="/" role="search" className="mx-auto hidden w-full max-w-sm md:block">
            <label htmlFor="nav-q" className="sr-only">Search</label>
            <input id="nav-q" name="q" placeholder="Search mini fridge, MATH 301, lamp…"
              className="w-full rounded-full border-[1.5px] border-line bg-card/70 px-4 py-1.5 text-[14px] outline-none transition-colors focus:border-accent" />
          </form>
          <nav aria-label="Sections" className="ml-auto hidden items-center sm:flex">
            <Link href="/wanted" className={navLink}>Wanted</Link>
            <Link href="/lottery" className={navLink}>Draw</Link>
            <Link href="/impact" className={`${navLink} hidden lg:inline`}>Impact</Link>
            {user ? (
              <>
                <Link href="/messages" className={navLink}>Messages<Dot n={counts.messages} /></Link>
                <Link href="/alerts" className={navLink}>Alerts<Dot n={counts.notifications} /></Link>
                {user.isAdmin && <Link href="/admin" className={`${navLink} hidden lg:inline`}>Organisers</Link>}
                <Link href="/me" className={navLink}>{first}{user.credits > 0 && <span className="ml-1 text-muted">· ⭐{user.credits / 100}</span>}</Link>
                <Link href="/listings/new" className="ml-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent-deep">Sell</Link>
              </>
            ) : (
              <>
                <Link href="/login" className={navLink}>Log in</Link>
                <Link href="/signup" className="ml-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent-deep">Join</Link>
              </>
            )}
          </nav>
          {/* phones: compact right side */}
          <div className="ml-auto flex items-center gap-1 sm:hidden">
            {user ? (
              <Link href="/messages" className={navLink}>Messages<Dot n={counts.messages} /></Link>
            ) : (
              <Link href="/signup" className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white">Join</Link>
            )}
          </div>
        </div>
      </header>
      <TabBar signedIn={!!user} badge={counts.notifications} />
    </>
  );
}
