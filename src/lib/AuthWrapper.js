// lib/AuthWrapper.jsx
"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "@/lib/AuthGuard";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export default function AuthWrapper({ children }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>; 
}
