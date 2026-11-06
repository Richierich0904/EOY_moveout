import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Motion } from "@/components/Motion";
import { APP_NAME, HANDOFF_SPOTS, SCHOOL_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/social";
import { creditBalance } from "@/lib/game";

export const metadata: Metadata = {
  title: `${APP_NAME} · ${SCHOOL_NAME}`,
  description: `Buy, sell and give away stuff with other students at ${SCHOOL_NAME}. Nothing ships, nothing gets thrown out.`,
};
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F4F1EA" }, { media: "(prefers-color-scheme: dark)", color: "#221D1A" }],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const counts = user ? unreadCounts(user.id) : { notifications: 0, messages: 0 };
  const gutter = "pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]";
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,400;9..144,500;9..144,600,100&family=Figtree:wght@400;500;600;700&display=swap" />
      </head>
      <body className="min-h-screen">
        <Nav appName={APP_NAME} user={user ? { name: user.name, credits: creditBalance(user.id), isAdmin: user.is_admin } : null} counts={counts} />
        <Motion />
        <main className={`mx-auto w-full max-w-6xl ${gutter} pb-28 pt-6 sm:pb-16 sm:pt-10`}>{children}</main>
        <footer className="bg-foot text-foot-ink">
          <div className={`mx-auto grid max-w-6xl gap-10 ${gutter} pb-28 pt-14 sm:pb-10 sm:pt-20`}>
            <p className="display max-w-[18em] text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.12]">Don&apos;t bin it. Swap it. Somebody on campus needs that lamp.</p>
            <div className="grid gap-8 text-[14.5px] sm:grid-cols-3">
              <div>
                <h3 className="eyebrow mb-3 font-[family-name:var(--font-body)]">Handoff spots</h3>
                <ul className="grid gap-1 opacity-85">{HANDOFF_SPOTS.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div>
                <h3 className="eyebrow mb-3 font-[family-name:var(--font-body)]">How it works</h3>
                <ul className="grid gap-1 opacity-85">
                  <li>Meet somewhere public on campus</li>
                  <li>Pay in cash or any app you both use</li>
                  <li>No fees, no shipping, ever</li>
                  <li>Leaving? List for fall handoff</li>
                </ul>
              </div>
              <div>
                <h3 className="eyebrow mb-3 font-[family-name:var(--font-body)]">Around {APP_NAME}</h3>
                <ul className="grid gap-1">
                  <li><Link href="/wanted" className="opacity-85 hover:text-accent hover:opacity-100">Wanted board</Link></li>
                  <li><Link href="/lottery" className="opacity-85 hover:text-accent hover:opacity-100">Giveaway draw</Link></li>
                  <li><Link href="/impact" className="opacity-85 hover:text-accent hover:opacity-100">Impact &amp; house cup</Link></li>
                  <li><Link href="/listings/new?mode=bulk" className="opacity-85 hover:text-accent hover:opacity-100">Clear out your room</Link></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-foot-ink/15 pt-5 text-[12.5px] opacity-65">
              <span>{APP_NAME} is a student-run marketplace for {SCHOOL_NAME}.</span>
              <span>Every item rehomed is one less in the skip in June.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
