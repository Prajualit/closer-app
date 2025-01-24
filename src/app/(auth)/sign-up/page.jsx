"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingButton from "@/components/Loadingbutton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const Page = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    setPending(true); // Set loading state
    try {
      const response = await fetch("http://localhost:5000/api/CreateUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          avatarUrl: data.avatarUrl,
        }),
      });

      const responseData = await response.json();
      console.log(responseData._id);
      if (!responseData.success) {
        throw new Error(responseData.message);
      } else {
        router.push("/setup-profile");
      }
    } catch (error) {
      console.log("Error during sign up:", error.message);
    } finally {
      setPending(false); // Reset loading state
    }
  };

  return (
    <div className="h-screen flex justify-center items-center">
      <Card className="w-full max-w-md rounded-xl shadow-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create Your Account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {["username", "email", "password", "confirmPassword"].map((field) => (
              <div key={field} className="mb-4">
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field === "confirmPassword"
                    ? "Confirm Password"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <Input
                  id={field}
                  type={
                    field === "password" || field === "confirmPassword"
                      ? "password"
                      : field === "email"
                      ? "email"
                      : "text"
                  }
                  placeholder={`Enter your ${field}`}
                  {...register(field, {
                    required: `${field} is required`,
                    validate:
                      field === "confirmPassword"
                        ? (value) =>
                            value === password || "Passwords do not match"
                        : undefined,
                  })}
                  autoComplete="off"
                  className={`mt-1 block w-full ${
                    errors[field] ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors[field] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[field].message}
                  </p>
                )}
              </div>
            ))}
            <LoadingButton pending={pending} disabled={pending}>
              Sign up
            </LoadingButton>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/sign-in" className="text-primary hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
