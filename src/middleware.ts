// The login wall. Le-SWAP is for students only, so every page except the welcome,
// sign-in and information pages needs a session cookie. This is the fast first check;
// each page then confirms the session is real with requireViewer().

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = new Set(["/", "/login", "/signup", "/verify", "/reset", "/rules", "/help", "/privacy", "/suspended"]);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!PUBLIC.has(pathname) && !req.cookies.has("swap_session")) {
    if (pathname.startsWith("/uploads/")) return new NextResponse("Sign in to see photos.", { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  // Tell the page where it is, so a stale session can be sent back to the right place after logging in.
  const headers = new Headers(req.headers);
  headers.set("x-path", pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
