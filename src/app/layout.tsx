import type { Metadata, Viewport } from "next";
import Link from "next/link";
// The typeface is served from this site, so students' browsers never call another company to load it.
import "@fontsource-variable/archivo/standard.css";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Motion } from "@/components/Motion";
import { APP_NAME, DEMO_MODE, HANDOFF_SPOTS, SCHOOL_NAME } from "@/lib/config";
import { getCurrentUser, isMember } from "@/lib/auth";
import { unreadCounts } from "@/lib/social";
import { creditBalance } from "@/lib/game";
import { categoryShelves } from "@/lib/listings";
import { housekeeping } from "@/lib/housekeeping";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · ${SCHOOL_NAME}`, template: `%s · ${APP_NAME}` },
  description: `Buy, sell and give away stuff with other students at ${SCHOOL_NAME}. Nothing ships, nothing gets thrown out.`,
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ECECEA" }, { media: "(prefers-color-scheme: dark)", color: "#141414" }],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  housekeeping();
  const user = await getCurrentUser();
  const member = isMember(user) ? user : null;
  const counts = member ? unreadCounts(member.id) : { notifications: 0, messages: 0 };
  const categoryCounts = member ? Object.fromEntries(categoryShelves().map((s) => [s.category, s.count])) : {};
  const gutter = "pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] sm:px-8";
  const footLink = "text-[13px] uppercase tracking-[.05em] text-muted transition hover:text-fg";
  return (
    <html lang="en">
      <body className="min-h-screen">
        {DEMO_MODE && <p className="bg-fg px-4 py-1.5 text-center text-[11.5px] font-semibold uppercase tracking-[.08em] text-bg">Demo mode · sign-up is not locked to the school · do not use with real students</p>}
        <Nav appName={APP_NAME} user={member ? { name: member.name, credits: creditBalance(member.id), isAdmin: member.is_admin, avatar: member.avatar } : null} pending={!!user && !member} counts={counts} categoryCounts={categoryCounts} />
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
                <h3 className="mb-1">Stay safe</h3>
                <Link href="/rules" className={footLink}>Rules &amp; what&apos;s not allowed</Link>
                <Link href="/help" className={footLink}>Help &amp; safety</Link>
                <Link href="/privacy" className={footLink}>Privacy</Link>
                <span className="text-[13px] uppercase tracking-[.05em] text-muted">Meet in public on campus</span>
              </div>
              <div className="grid content-start gap-2">
                <h3 className="mb-1">Around {APP_NAME}</h3>
                {member ? (
                  <>
                    <Link href="/wanted" className={footLink}>Wanted board</Link>
                    <Link href="/draw" className={footLink}>Giveaway draw</Link>
                    <Link href="/rankings" className={footLink}>Rankings &amp; prizes</Link>
                    <Link href="/impact" className={footLink}>Impact &amp; dorm cup</Link>
                    <Link href="/listings/new?mode=bulk" className={footLink}>Clear out your room</Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup" className={footLink}>Join with school email</Link>
                    <Link href="/login" className={footLink}>Log in</Link>
                  </>
                )}
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
