import Link from "next/link";
import { NavMenu } from "./NavMenu";
import { Icon, Mark } from "./Icons";
import { CATEGORIES } from "@/lib/config";
import { logout } from "@/actions/auth";

type Props = {
  appName: string;
  /** A verified student, or null for visitors. */
  user: { name: string; credits: number; isAdmin: boolean; avatar: string | null } | null;
  /** Signed in but not allowed in yet (still verifying, or paused). */
  pending: boolean;
  counts: { notifications: number; messages: number };
  categoryCounts: Record<string, number>;
};

function Dot({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-bg">{n > 9 ? "9+" : n}</span>;
}

const round = "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition hover:opacity-80";
const textLink = "text-[12.5px] font-medium tracking-[.03em] transition hover:text-accent [font-stretch:112%]";

export function Nav({ appName, user, pending, counts, categoryCounts }: Props) {
  const first = user?.name.split(" ")[0];
  const info = [{ href: "/rules", label: "Rules" }, { href: "/help", label: "Help & safety" }];
  const sections = user
    ? [
        { href: "/", label: "Shop" }, { href: "/wanted", label: "Wanted" }, { href: "/rankings", label: "Rankings" }, { href: "/draw", label: "Giveaway draw" }, { href: "/impact", label: "Impact" },
        { href: "/messages", label: "Messages", count: counts.messages }, { href: "/alerts", label: "Alerts", count: counts.notifications }, { href: "/me", label: "My account" },
        ...(user.isAdmin ? [{ href: "/admin", label: "Organisers" }] : []),
        ...info,
      ]
    : [{ href: "/", label: "Home" }, ...info, ...(pending ? [{ href: "/verify", label: "Verify email" }] : [{ href: "/login", label: "Log in" }, { href: "/signup", label: "Join" }])];
  const categories = user ? CATEGORIES.map((c) => ({ href: `/?category=${c.slug}#browse`, label: c.label, count: categoryCounts[c.slug] ?? 0 })) : [];
  return (
    <>
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-fg focus:px-4 focus:py-2 focus:text-[12px] focus:font-semibold focus:uppercase focus:tracking-[.08em] focus:text-bg">Skip to content</a>
    <header id="site-nav"
      className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-[var(--nav)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(.25,.1,.25,1)] data-[hidden]:-translate-y-full">
      <div className="mx-auto grid h-[64px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-3 pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] sm:h-[76px] sm:px-8">
        <div className="flex items-center gap-6">
          <NavMenu sections={sections} categories={categories} />
          <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
            <Link href="/" className={textLink}>Home</Link>
            {user ? (
              <>
                <Link href="/wanted" className={textLink}>Wanted</Link>
                <Link href="/rankings" className={textLink}>Rankings</Link>
                <Link href="/draw" className={textLink}>Draw</Link>
                <Link href="/impact" className={`${textLink} hidden lg:inline`}>Impact</Link>
              </>
            ) : (
              <>
                <Link href="/rules" className={textLink}>Rules</Link>
                <Link href="/help" className={textLink}>Help &amp; safety</Link>
              </>
            )}
          </nav>
        </div>

        <Link href="/" aria-label={`${appName} home`} className="flex items-center gap-1.5 justify-self-center text-fg">
          <Mark size={24} /><span className="display hidden text-[15px] tracking-[.02em] sm:inline">{appName}</span>
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
              {user.credits > 0 && <Link href="/me#credits" data-credits className="hidden h-9 items-center border border-line px-2.5 text-[11.5px] font-semibold tabular-nums transition hover:border-fg sm:flex" aria-label={`${user.credits / 100} credits. See what they do.`}>⭐ {user.credits / 100}</Link>}
              <Link href="/me" aria-label="My account" className={user.avatar ? "relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line transition hover:opacity-80" : round}>{user.avatar ? <img src={`/uploads/${user.avatar}`} alt="" className="h-full w-full object-cover" /> : <Icon name="user" size={16} />}<span className="sr-only">{first}</span></Link>
            </>
          ) : pending ? (
            <form action={logout}><button className={textLink}>Sign out</button></form>
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
    </>
  );
}
