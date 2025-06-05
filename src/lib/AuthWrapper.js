// lib/AuthWrapper.jsx
"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "@/lib/AuthGuard";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export default function AuthWrapper({ children }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>; // public route, no auth guard
  }

  return <AuthGuard>{children}</AuthGuard>; // protected route, use auth guard
}
