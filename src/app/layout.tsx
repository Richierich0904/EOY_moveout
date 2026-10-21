import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { APP_NAME, SCHOOL_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/social";

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
        <Nav user={user ? { name: user.name, verified: !!user.verified } : null} counts={counts} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:pb-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted">
          {APP_NAME} is a student-run marketplace for {SCHOOL_NAME}. Meet in public places. Pay however you both agree. No shipping, no fees.
        </footer>
      </body>
    </html>
  );
}
