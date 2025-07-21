// lib/AuthWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "./AuthGuard";

const PUBLIC_ROUTES: string[] = ["/sign-in", "/sign-up"];

import type { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();

  // Defensive: handle undefined pathname (shouldn't happen in Next.js, but for strict mode)
  if (!pathname || PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>;
}
