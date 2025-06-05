import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("accessToken");

  const isLoggedIn = !!token;

  if (!isLoggedIn && request.nextUrl.pathname !== "/sign-in" || request.nextUrl.pathname !== "/sign-up") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
};
