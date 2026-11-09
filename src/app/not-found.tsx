import Link from "next/link";

export const metadata = { title: "Not found · Swap" };

export default function NotFound() {
  return (
    <div className="rise grid max-w-2xl gap-5 py-10">
      <p className="text-[11.5px] tracking-[.04em] text-muted">404</p>
      <h1 className="text-[clamp(2.4rem,6vw,4.4rem)]">Nothing on<br />this shelf.</h1>
      <p className="sub">The page you asked for isn&apos;t here. It may have been rehomed.</p>
      <div className="flex flex-wrap gap-2"><Link href="/#browse" className="btn-primary">Back to the shelves</Link><Link href="/wanted" className="btn-ghost">Wanted board</Link></div>
    </div>
  );
}
