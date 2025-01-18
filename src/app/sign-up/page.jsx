"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingButton from "@/components/Loadingbutton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const Page = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch("http://localhost:5000/api/CreateUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message);
      }

      setCredentials({ name: "", email: "", password: "", confirmPassword: "" });
      router.push("/sign-in");
    } catch (error) {
      console.error("Error during sign up:", error.message);
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
            {["name", "email", "password", "confirmPassword"].map((field) => (
              <div key={field} className="mb-4">
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
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
                    validate: field === "confirmPassword"
                      ? (value) =>
                          value === credentials.password ||
                          "Passwords do not match"
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
            <LoadingButton pending={pending}>Sign up</LoadingButton>
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
