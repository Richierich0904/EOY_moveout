import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { APP_NAME, SCHOOL_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/social";
import { creditBalance } from "@/lib/game";

export const metadata: Metadata = {
  title: `${APP_NAME} · ${SCHOOL_NAME}`,
  description: `Buy, sell and give away stuff with other students at ${SCHOOL_NAME}. Nothing ships, nothing gets thrown out.`,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const counts = user ? unreadCounts(user.id) : { notifications: 0, messages: 0 };
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav user={user ? { name: user.name, house: user.house, verified: !!user.verified, credits: creditBalance(user.id), isAdmin: user.is_admin } : null} counts={counts} />
        <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 pt-3 sm:pb-10">{children}</main>
        <footer className="mt-6 bg-subheader py-6 text-center text-[12px] text-[#ddd]">
          <div className="mx-auto max-w-[1500px] px-3">
            <p className="font-bold text-white">{APP_NAME} is a student-run marketplace for {SCHOOL_NAME}.</p>
            <p className="mt-1">Meet in public places · Pay however you both agree · No shipping, no fees</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
