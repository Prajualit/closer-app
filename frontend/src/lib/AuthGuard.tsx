"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { API_ENDPOINTS } from "./api";

import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<boolean>(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    // Skip auth check for /public routes
    if (pathname && pathname.startsWith("/public")) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      setDebugInfo("Starting auth check...");

      // Check if we have any refresh token in cookies first
      const cookies = document.cookie.split(';');
      const refreshTokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('refreshToken=')
      );
      
      // EMERGENCY FIX: Also check localStorage
      const refreshTokenLS = localStorage.getItem('refreshToken');
      
      console.log("🍪 All cookies:", document.cookie);
      console.log("🔍 Refresh token cookie found:", !!refreshTokenCookie);
      console.log("💾 Refresh token in localStorage:", !!refreshTokenLS);
      
      if (!refreshTokenCookie && !refreshTokenLS) {
        console.log("No refresh token found anywhere, redirecting to sign-in");
        setDebugInfo("No refresh token found in cookies or localStorage");
        router.push("/sign-in");
        return;
      }

      try {
        console.log("📡 Making refresh token request...");
        
        // Try to get refresh token from cookies first, fallback to localStorage
        const refreshToken = refreshTokenCookie ? 
          refreshTokenCookie.split('=')[1] : 
          localStorage.getItem('refreshToken');
        
        const res = await fetch(
          API_ENDPOINTS.REFRESH_TOKEN,
          {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: "include",
            body: JSON.stringify({ refreshToken })
          }
        );

        setDebugInfo(`Response status: ${res.status}`);

        if (res.ok) {
          const data = await res.json();
          
          // Store new tokens in localStorage as backup
          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
          
          setDebugInfo("Auth successful!");
          setLoading(false);
        } else {
          const errorText = await res.text();
          console.log("Auth failed, redirecting to sign-in");
          setDebugInfo(`Auth failed: ${errorText}`);

          // Clear any existing cookies by calling logout
          try {
            await fetch(API_ENDPOINTS.LOGOUT, {
              method: "POST",
              credentials: "include",
            });
          } catch (logoutError) {
            console.log("Logout failed, but continuing to redirect");
          }
          
          // Clear localStorage tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("💥 Auth check failed:", error);
        let message = "Unknown error";
        if (error instanceof Error) {
          message = error.message;
        }
        setDebugInfo(`Error: ${message}`);
        router.push("/sign-in");
      }
    }

    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
        <Image
          src={logo}
          alt="logo"
          width={300}
          height={300}
          priority={true}
          className="drop-shadow-lg dark:brightness-0 dark:contrast-0 dark:invert"
        />
      </div>
    );
  }

  return (<>{children}</>);
}
