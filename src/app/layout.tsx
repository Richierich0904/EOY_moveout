import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Motion } from "@/components/Motion";
import { APP_NAME, HANDOFF_SPOTS, SCHOOL_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/social";
import { creditBalance } from "@/lib/game";
import { categoryShelves } from "@/lib/listings";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · ${SCHOOL_NAME}`, template: `%s · ${APP_NAME}` },
  description: `Buy, sell and give away stuff with other students at ${SCHOOL_NAME}. Nothing ships, nothing gets thrown out.`,
};
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ECECEA" }, { media: "(prefers-color-scheme: dark)", color: "#141414" }],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const counts = user ? unreadCounts(user.id) : { notifications: 0, messages: 0 };
  const categoryCounts = Object.fromEntries(categoryShelves().map((s) => [s.category, s.count]));
  const gutter = "pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] sm:px-8";
  const footLink = "text-[13px] uppercase tracking-[.05em] text-muted transition hover:text-fg";
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" />
      </head>
      <body className="min-h-screen">
        <Nav appName={APP_NAME} user={user ? { name: user.name, credits: creditBalance(user.id), isAdmin: user.is_admin } : null} counts={counts} categoryCounts={categoryCounts} />
        <Motion />
        <main id="main" className={`mx-auto w-full max-w-[1280px] ${gutter} pb-20 pt-4 sm:pt-8`}>{children}</main>
        <footer className="border-t border-line">
          <div className={`mx-auto grid max-w-[1280px] gap-12 ${gutter} pb-10 pt-14 sm:pt-20`}>
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
              <p className="text-[clamp(2rem,4.4vw,3.2rem)] font-black uppercase leading-[.9] [font-stretch:125%]">Don&apos;t bin it.<br />Swap it.</p>
              <div className="grid content-start gap-2">
                <h3 className="mb-1">Handoff spots</h3>
                {HANDOFF_SPOTS.map((s) => <span key={s} className="text-[13px] uppercase tracking-[.05em] text-muted">{s}</span>)}
              </div>
              <div className="grid content-start gap-2">
                <h3 className="mb-1">How it works</h3>
                {["Meet in public on campus", "Pay cash or any app", "No fees, no shipping", "Leaving? Fall handoff"].map((s) => <span key={s} className="text-[13px] uppercase tracking-[.05em] text-muted">{s}</span>)}
              </div>
              <div className="grid content-start gap-2">
                <h3 className="mb-1">Around {APP_NAME}</h3>
                <Link href="/wanted" className={footLink}>Wanted board</Link>
                <Link href="/lottery" className={footLink}>Giveaway draw</Link>
                <Link href="/impact" className={footLink}>Impact &amp; house cup</Link>
                <Link href="/listings/new?mode=bulk" className={footLink}>Clear out your room</Link>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-[11.5px] uppercase tracking-[.08em] text-muted">
              <span>{APP_NAME} · a student-run marketplace for {SCHOOL_NAME}</span>
              <span>Every item rehomed is one less in the skip in June</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
