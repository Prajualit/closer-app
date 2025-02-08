"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingButton from "@/components/Loadingbutton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
import dotenv from "dotenv";
import { gapi } from "gapi-script";

dotenv.config();

const page = () => {

  const router = useRouter();
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setPending(true); // Set loading state
    try {
      const response = await fetch("http://localhost:5000/api/loginuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const responseData = await response.json();
      console.log(responseData);
      if (!responseData.success) {
        throw new Error(responseData.message);
      } else if (responseData.success) {
        router.push('http://localhost:3000/');
      }
    }
    catch (error) {
      console.log("Error during sign up:", error.message);
    }
    finally {
      setPending(false);
    }
  };

  return (

    <div className="h-screen flex justify-center items-center">
      <Card className="w-full max-w-md rounded-xl shadow-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Log Into Your Account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {["email", "password"].map((field) => (
              <div key={field} className="mb-4">
                <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <Input
                  type={field === "password" ? "password" : "text"}
                  label={field}
                  {...register(field, {
                    required: field === "email" ? "Email is required" : "Password is required",
                  })}
                  placeholder={`Enter your ${field}`}
                  error={errors[field]}
                />
                {errors[field] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[field].message}
                  </p>
                )}
              </div>
            ))}
            <LoadingButton
              type="submit"
              pending={pending}
            >
              Sign In
            </LoadingButton>
            <div className="text-center text-[16px] text-gray-700 font-medium w-full my-2 flex items-center justify-between">
              <span className="w-[45%] border-[1px] "></span>
              <span>
                or
              </span>
              <span className="w-[45%] border-[1px] "></span>
            </div>
            {/* <LoadingButton
                type="submit"
                pending={pending}
                href="http://localhost:5000/auth/google">
                Sign In with Google
              </LoadingButton> */}
            <GoogleLogin
              clientId={`${process.env.GOOGLE_CLIENT_ID}`}
              onSuccess={(res) => console.log(res)}
              onError={() => "Login Failed"}
            />
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/sign-up" className="text-primary hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default page
