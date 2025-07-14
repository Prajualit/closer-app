"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { API_ENDPOINTS } from "./api";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    async function checkAuth() {
      setDebugInfo("Starting auth check...");

      // Check if we have any refresh token in cookies first
      const cookies = document.cookie.split(';');
      const refreshTokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('refreshToken=')
      );
      
      console.log("🍪 All cookies:", document.cookie);
      console.log("🔍 Refresh token cookie found:", !!refreshTokenCookie);
      
      if (!refreshTokenCookie) {
        console.log("No refresh token found, redirecting to sign-in");
        setDebugInfo("No refresh token found in cookies");
        router.push("/sign-in");
        return;
      }

      try {
        console.log("📡 Making refresh token request...");
        const res = await fetch(
          API_ENDPOINTS.REFRESH_TOKEN,
          {
            method: "POST",
            credentials: "include",
          }
        );

        setDebugInfo(`Response status: ${res.status}`);

        if (res.ok) {
          const data = await res.json();
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
          
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("💥 Auth check failed:", error);
        setDebugInfo(`Error: ${error.message}`);
        router.push("/sign-in");
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900">
        <Image
          src={logo}
          alt="logo"
          width={300}
          height={300}
          priority
          className="drop-shadow-lg dark:brightness-0 dark:contrast-0 dark:invert"
        />
      </div>
    );
  }

  return <>{children}</>;
}
