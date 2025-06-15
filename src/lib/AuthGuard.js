"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    async function checkAuth() {
      setDebugInfo("Starting auth check...");

      try {
        console.log("📡 Making refresh token request...");
        const res = await fetch(
          "http://localhost:5000/api/v1/users/refresh-token",
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
          setDebugInfo(`Auth failed: ${errorText}`);

          await fetch("http://localhost:5000/api/v1/users/logout", {
            method: "POST",
            credentials: "include",
          });
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
      <div className="h-screen w-screen flex flex-col items-center justify-center">
        <Image src={logo} alt="logo" width={300} height={300} priority />
        <div className="mt-4 text-sm text-gray-600">Debug: {debugInfo}</div>
        <div className="mt-2 text-xs text-gray-400">
          Check console for detailed logs
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
