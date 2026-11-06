import Link from "next/link";
import { NavMenu } from "./NavMenu";
import { Icon, Mark } from "./Icons";
import { CATEGORIES } from "@/lib/config";

type Props = {
  appName: string;
  user: { name: string; credits: number; isAdmin: boolean } | null;
  counts: { notifications: number; messages: number };
  categoryCounts: Record<string, number>;
};

function Dot({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-bg">{n > 9 ? "9+" : n}</span>;
}

const round = "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition hover:opacity-80";
const textLink = "text-[12.5px] font-medium tracking-[.03em] transition hover:text-accent [font-stretch:112%]";

export function Nav({ appName, user, counts, categoryCounts }: Props) {
  const first = user?.name.split(" ")[0];
  const sections = [
    { href: "/", label: "Shop" }, { href: "/wanted", label: "Wanted" }, { href: "/lottery", label: "Giveaway draw" }, { href: "/impact", label: "Impact" },
    ...(user ? [{ href: "/messages", label: "Messages", count: counts.messages }, { href: "/alerts", label: "Alerts", count: counts.notifications }, { href: "/me", label: "My account" }] : [{ href: "/login", label: "Log in" }, { href: "/signup", label: "Join" }]),
    ...(user?.isAdmin ? [{ href: "/admin", label: "Organisers" }] : []),
  ];
  const categories = CATEGORIES.map((c) => ({ href: `/?category=${c.slug}#browse`, label: c.label, count: categoryCounts[c.slug] ?? 0 }));
  return (
    <header id="site-nav"
      className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-[var(--nav)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(.25,.1,.25,1)] data-[hidden]:-translate-y-full">
      <div className="mx-auto grid h-[64px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-3 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] sm:h-[76px] sm:px-8">
        <div className="flex items-center gap-6">
          <NavMenu sections={sections} categories={categories} />
          <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
            <Link href="/" className={textLink}>Home</Link>
            <Link href="/wanted" className={textLink}>Wanted</Link>
            <Link href="/lottery" className={textLink}>Draw</Link>
            <Link href="/impact" className={`${textLink} hidden lg:inline`}>Impact</Link>
          </nav>
        </div>

        <Link href="/" aria-label={`${appName} home`} className="flex items-center gap-1.5 justify-self-center text-fg">
          <Mark size={24} /><span className="display hidden text-[15px] uppercase tracking-[.02em] sm:inline">{appName}</span>
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-2.5">
          {user ? (
            <>
              <Link href="/alerts" aria-label={`Alerts${counts.notifications ? `, ${counts.notifications} new` : ""}`} className={`${round} hidden sm:flex`}><Icon name="bell" size={16} /><Dot n={counts.notifications} /></Link>
              <Link href="/messages" aria-label={`Messages${counts.messages ? `, ${counts.messages} unread` : ""}`} className={round}><Icon name="chat" size={16} /><Dot n={counts.messages} /></Link>
              <Link href="/listings/new" className="flex h-9 items-center gap-2 rounded-full bg-accent pl-4 pr-1 text-[11.5px] font-semibold uppercase tracking-[.08em] text-white transition hover:bg-accent-deep [font-stretch:112%]">
                <span className="hidden sm:inline">Sell</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full ring-[1.5px] ring-white"><Icon name="plus" size={14} stroke={2.2} /></span>
              </Link>
              <Link href="/me" aria-label="My account" className={round}><Icon name="user" size={16} /><span className="sr-only">{first}</span>
                {user.credits > 0 && <span className="absolute -bottom-1 -right-2 rounded-full bg-bg px-1 text-[10px] font-bold text-fg ring-1 ring-line">⭐{user.credits / 100}</span>}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={`${textLink} hidden sm:inline`}>Log in</Link>
              <Link href="/signup" className="flex h-9 items-center gap-2 rounded-full bg-accent pl-4 pr-1 text-[11.5px] font-semibold uppercase tracking-[.08em] text-white transition hover:bg-accent-deep [font-stretch:112%]">
                Join<span className="flex h-7 w-7 items-center justify-center rounded-full ring-[1.5px] ring-white"><Icon name="arrow" size={13} stroke={2.2} /></span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
