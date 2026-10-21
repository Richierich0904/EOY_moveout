import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { logout } from "@/actions/auth";

type Props = { user: { name: string; verified: boolean } | null; counts: { notifications: number; messages: number } };

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-free px-1 text-center text-[10px] font-bold leading-4 text-white">{n > 9 ? "9+" : n}</span>;
}

export function Nav({ user, counts }: Props) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="text-xl font-black tracking-tight">{APP_NAME}</Link>
          <form action="/" className="hidden flex-1 sm:block">
            <input name="q" placeholder="Search for anything… try “mini fridge” or a course code" className="input" />
          </form>
          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            <Link href="/wanted" className="btn-ghost">Wanted</Link>
            <Link href="/impact" className="btn-ghost">Impact</Link>
            {user ? (
              <>
                <Link href="/messages" className="btn-ghost relative">Messages<Badge n={counts.messages} /></Link>
                <Link href="/alerts" className="btn-ghost relative">Alerts<Badge n={counts.notifications} /></Link>
                <Link href="/me" className="btn-ghost">{user.name.split(" ")[0]}</Link>
                <Link href="/listings/new" className="btn-primary">+ Sell</Link>
                <form action={logout}><button className="btn-ghost text-muted">Log out</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Log in</Link>
                <Link href="/signup" className="btn-primary">Join</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card text-xs sm:hidden">
        <Link href="/" className="flex flex-col items-center py-2">🏠<span>Browse</span></Link>
        <Link href="/wanted" className="flex flex-col items-center py-2">🙋<span>Wanted</span></Link>
        <Link href="/listings/new" className="flex flex-col items-center py-2 font-bold text-accent">➕<span>Sell</span></Link>
        <Link href="/messages" className="relative flex flex-col items-center py-2">💬<span>Chat</span><span className="absolute right-4 top-1"><Badge n={counts.messages} /></span></Link>
        <Link href={user ? "/me" : "/login"} className="relative flex flex-col items-center py-2">👤<span>{user ? "Me" : "Log in"}</span><span className="absolute right-4 top-1"><Badge n={counts.notifications} /></span></Link>
      </nav>
    </>
  );
}
