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

const page = () => {

  const dispatch = useDispatch();

  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
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
      console.log("🍪 All response headers:", [...response.headers.entries()]);

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
    catch (error) {
      setError(error.message);
      console.log("Error during login:", error.message);
    }
    finally {
      setPending(false);
    }
  };

  return (

    <div className="h-screen flex justify-center items-center bg-neutral-50 dark:bg-neutral-900">
      <Card className="w-full max-w-md rounded-xl shadow-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Sign In</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">Log Into Your Account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {["username", "password"].map((field) => (
              <div key={field} className="mb-4">
                <label htmlFor={field} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  className={`bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 ${errors[field] ? "border-red-500 dark:border-red-500" : ""}`}
                />
                {errors[field] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[field].message}
                  </p>
                )}
              </div>
            ))}
            
            {/* General error message */}
            {error && (
              <div className="mb-4">
                <p className="text-red-500 text-sm">
                  {error}
                </p>
              </div>
            )}
            
            <LoadingButton
              type="submit"
              pending={pending}
            >
              Sign In
            </LoadingButton>
            {/* <div className="text-center text-[16px] text-gray-700 font-medium w-full my-2 flex items-center justify-between">
              <span className="w-[45%] border-[1px] "></span>
              <span>
                or
              </span>
              <span className="w-[45%] border-[1px] "></span>
            </div>
            <LoadingButton
                type="submit"
                pending={pending}
                href={API_ENDPOINTS.GOOGLE_AUTH}>
                Sign In with Google
              </LoadingButton>
            <GoogleLogin
              clientId={`${process.env.GOOGLE_CLIENT_ID}`}
              onSuccess={(res) => console.log(res)}
              onError={() => "Login Failed"}
            /> */}
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/sign-up" className="text-blue-600 dark:text-blue-400 hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default page
