"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingButton from "@/components/LoadingButton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slice/userSlice.js";
import { API_ENDPOINTS } from "@/lib/api";


interface LoginFormData {
  username: string;
  password: string;
}

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const fields: (keyof LoginFormData)[] = ["username", "password"];

  const onSubmit = async (data: LoginFormData) => {
    setPending(true);
    try {
      console.log("🚀 Making login request to:", API_ENDPOINTS.LOGIN);

      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      console.log("📡 Login response status:", response.status);
      console.log("🍪 Set-Cookie headers:", response.headers.get('set-cookie'));
      // Use for...of for compatibility with Headers.entries()
      const allHeaders: [string, string][] = [];
      for (const entry of response.headers as any) {
        allHeaders.push(entry);
      }
      console.log("🍪 All response headers:", allHeaders);

      const responseData = await response.json();
      console.log("📦 Response data:", responseData);

      if (!responseData.success) {
        throw new Error(responseData.message);
      } else {
        console.log("✅ Login successful, dispatching user data");
        dispatch(setUser(responseData.data.user));

        // EMERGENCY FIX: Store tokens in localStorage as backup
        if (responseData.data.accessToken) {
          localStorage.setItem('accessToken', responseData.data.accessToken);
        }
        if (responseData.data.refreshToken) {
          localStorage.setItem('refreshToken', responseData.data.refreshToken);
        }

        // Check if cookies were actually set
        console.log("🍪 Cookies after login:", document.cookie);
        console.log("💾 Stored tokens in localStorage as backup");

        router.push(`/${responseData.data.user.username}/home`);
      }
    }
    catch (error: any) {
      setError(error?.message || "Unknown error");
      console.log("Error during login:", error?.message);
    }
    finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-50 dark:bg-neutral-900 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md rounded-xl shadow-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
        <CardHeader className="px-4 sm:px-6 pt-6 pb-4">
          <CardTitle className="text-lg sm:text-xl text-neutral-900 dark:text-white text-center">Sign In</CardTitle>
          <CardDescription className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 text-center">Log Into Your Account</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {fields.map((field) => (
              <div key={field} className="mb-4">
                <label htmlFor={field} className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <Input
                  type={field === "password" ? "password" : "text"}
                  label={field}
                  {...register(field, {
                    required: field === "username" ? "Username is required" : "Password is required",
                  })}
                  placeholder={`Enter your ${field}`}
                  error={errors[field]}
                  disabled={pending}
                  className={`bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 text-sm sm:text-base h-10 sm:h-11 ${errors[field] ? "border-red-500 dark:border-red-500" : ""}`}
                />
                {typeof errors[field]?.message === 'string' && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors[field]?.message}
                  </p>
                )}
              </div>
            ))}
            {/* General error message */}
            {error && (
              <div className="mb-4">
                <p className="text-red-500 text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </p>
              </div>
            )}
            <LoadingButton
              type="submit"
              pending={pending}
              className="h-10 sm:h-12 text-sm sm:text-base"
            >
              Sign In
            </LoadingButton>
          </form>
          <div className="mt-4 text-center">
            <Link href="/sign-up" className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
