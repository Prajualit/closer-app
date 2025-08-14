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

  useEffect(() => {

    async function checkAuth() {
      // Check if we have any refresh token in cookies first
      const cookies = document.cookie.split(';');
      const refreshTokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('refreshToken=')
      );
      
      // EMERGENCY FIX: Also check localStorage
      const refreshTokenLS = localStorage.getItem('refreshToken');
      
      if (!refreshTokenCookie && !refreshTokenLS) {
        router.push("/sign-in");
        return;
      }

      try {
        // Try to get refresh token from cookies first, fallback to localStorage
        const refreshToken = refreshTokenCookie ? 
          refreshTokenCookie.split('=')[1] : 
          localStorage.getItem('refreshToken');
        
        // Get access token for Authorization header fallback
        const accessToken = localStorage.getItem('accessToken');
        
        const res = await fetch(
          API_ENDPOINTS.REFRESH_TOKEN,
          {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              // Include Authorization header as fallback
              ...(accessToken && { Authorization: `Bearer ${accessToken}` })
            },
            credentials: "include",
            body: JSON.stringify({ refreshToken })
          }
        );

        if (res.ok) {
          const data = await res.json();
          
          // Store new tokens in localStorage as backup
          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
          
          setLoading(false);
        } else {
          // Clear any existing cookies by calling logout
          try {
            await fetch(API_ENDPOINTS.LOGOUT, {
              method: "POST",
              credentials: "include",
            });
          } catch (logoutError) {
            // Silently handle logout errors during cleanup
          }
          
          // Clear localStorage tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
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
