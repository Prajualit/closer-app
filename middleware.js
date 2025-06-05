import { NextResponse } from "next/server";

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
    `$http://localhost:5000/api/v1/users/refresh-token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
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
  await fetch(`http://localhost:5000/api/v1/users/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  url.pathname = "/sign-in";
  // Don't clear cookies here, logout route does it
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!sign-in|sign-up|public).*)"],
};
