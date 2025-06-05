"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Make a request to backend that will validate tokens from HttpOnly cookies
        const res = await fetch(
          "http://localhost:5000/api/v1/users/refresh-token",
          {
            method: "POST",
            credentials: "include", // important to send HttpOnly cookies
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Optionally update local state if needed
          setLoading(false);
        } else {
          // Refresh token invalid or expired, logout backend will clear cookies
          await fetch("http://localhost:5000/api/v1/users/logout", {
            method: "POST",
            credentials: "include",
          });
          router.push("/sign-in");
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/sign-in");
        return;
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Image src={logo} alt="logo" width={300} height={300} priority />
      </div>
    );
  }

  return <>{children}</>;
}
