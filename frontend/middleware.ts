import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Polyfill Buffer for Edge runtime if needed
  const getBuffer = () => {
    if (typeof Buffer !== 'undefined') return Buffer;
    // @ts-ignore
    return require('buffer').Buffer;
  };

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const url = request.nextUrl.clone();

  // Allow public routes
  if (
    url.pathname === "/sign-in" ||
    url.pathname === "/sign-up" ||
    url.pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  function isAccessTokenValid(token: string): boolean {
    try {
      const buffer = getBuffer();
      const payload = JSON.parse(
        buffer.from(token.split(".")[1], "base64").toString()
      );
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  if (accessToken && isAccessTokenValid(accessToken)) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    if (url.pathname !== "/sign-in" && url.pathname !== "/sign-up") {
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Try refreshing access token
  const refreshRes = await fetch(
    `${API_BASE_URL}/api/v1/users/refresh-token`,
    {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`
      },
      credentials: 'include'
    }
  );

  if (refreshRes.ok) {
    const { accessToken: newAccessToken } = await refreshRes.json();
    const response = NextResponse.next();
    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      path: "/",
      maxAge: 15 * 60, // 15 mins
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    return response;
  }

  // Refresh token invalid or expired → call logout endpoint
  await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
  });

  url.pathname = "/sign-in";
  // Don't clear cookies here, logout route does it
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up).*)',
  ],
};
