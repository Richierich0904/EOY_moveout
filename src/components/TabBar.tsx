"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  browse: <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  wanted: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  draw: <path d="M12 3.5l2.2 5.3 5.3 2.2-5.3 2.2L12 18.5l-2.2-5.3L4.5 11l5.3-2.2z" />,
  you: <><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>,
};

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[name]}</svg>;
}

export function TabBar({ signedIn, badge }: { signedIn: boolean; badge: number }) {
  const p = usePathname();
  const tabs = [
    { href: "/", label: "Browse", icon: "browse", on: p === "/" || (p.startsWith("/listings/") && !p.startsWith("/listings/new")) },
    { href: "/wanted", label: "Wanted", icon: "wanted", on: p.startsWith("/wanted") },
    { href: "/listings/new", label: "Sell", icon: "sell", on: p.startsWith("/listings/new") },
    { href: "/lottery", label: "Draw", icon: "draw", on: p.startsWith("/lottery") },
    { href: signedIn ? "/me" : "/login", label: signedIn ? "You" : "Log in", icon: "you", on: ["/me", "/login", "/signup", "/alerts", "/messages"].some((s) => p.startsWith(s)), badge },
  ];
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[var(--nav)] pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl backdrop-saturate-150 sm:hidden">
      <div className="grid grid-cols-5 pl-[max(8px,env(safe-area-inset-left,0px))] pr-[max(8px,env(safe-area-inset-right,0px))]">
        {tabs.map((t) => (
          <Link key={t.label} href={t.href} aria-current={t.on ? "page" : undefined}
            className={`relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors ${t.on ? "text-accent" : "text-muted"}`}>
            {t.icon === "sell"
              ? <span className="flex h-[22px] w-10 items-center justify-center rounded-full bg-accent text-white"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg></span>
              : <Icon name={t.icon} />}
            {t.label}
            {!!t.badge && <span className="absolute left-1/2 top-1 ml-1.5 min-w-[16px] rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white">{t.badge > 9 ? "9+" : t.badge}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}
