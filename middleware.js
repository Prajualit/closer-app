import { NextResponse } from "next/server";

// Use environment variable for API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function middleware(request) {
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

  function isAccessTokenValid(token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
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
    // No refresh token, redirect to sign-in
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Try refreshing access token
  const refreshRes = await fetch(
    `$${API_BASE_URL}/api/v1/users/refresh-token`,
    {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sign-in and sign-up pages
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up).*)',
  ],
};
