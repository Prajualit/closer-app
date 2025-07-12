"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingButton from "@/components/Loadingbutton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slice/userSlice.js";

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
      const response = await fetch("http://localhost:5000/api/v1/users/login", {
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

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message);
      } else {
        dispatch(setUser(responseData.data.user));
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
                href="http://localhost:5000/auth/google">
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
