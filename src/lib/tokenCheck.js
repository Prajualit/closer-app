"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";

function isTokenExpired(token) {
  if (!token) return true;

  const payloadBase64 = token.split(".")[1];
  if (!payloadBase64) return true;

  try {
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    return payload.exp < Date.now() / 1000;
  } catch (err) {
    console.error("Failed to parse JWT:", err);
    return true;
  }
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function TokenCheck() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      if (pathname === "/sign-in" || pathname === "/sign-up") {
        console.log("On login/signup page, skipping token check.");
        setLoading(false);
        return;
      }

      const accessToken = getCookie("accessToken");

      if (!accessToken || isTokenExpired(accessToken)) {
        console.log(
          "Access token expired or missing. Attempting to refresh..."
        );

        try {
          const res = await fetch("/users/refresh-token", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) throw new Error("Failed to refresh token");

          const data = await res.json();
          console.log("Token refreshed successfully:", data.data.accessToken);
        } catch (err) {
          console.warn("Refresh token expired or failed. Logging out...", err);
          try {
            await fetch("/users/logout", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            });
          } catch (logoutErr) {
            console.error("Logout failed:", logoutErr);
          }
          window.location.href = "/sign-in";
        }
      } else {
        console.log("Access token is still valid.");
      }

      setLoading(false);
    };

    checkToken();
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <Image src={logo} alt="logo" width={300} height={300} />
        </div>
      )}
    </>
  );
}
