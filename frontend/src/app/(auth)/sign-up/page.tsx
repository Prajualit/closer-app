"use client";
import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import LoadingButton from "@/components/LoadingButton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slice/userSlice";
import { API_ENDPOINTS } from "@/lib/api";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

interface SignUpFormData {
  username: string;
  name: string;
  bio: string;
  password: string;
  confirmPassword: string;
}

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [pending, setPending] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isNext, setIsNext] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    setError: setFormError,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const password = watch("password");

  const handleImageClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setImageError("Please select a valid image file.");
        return;
      }
      setImage(file);
      setImageError(null);
    }
  };

  // Separate function for actual form submission
  const submitForm = async (data: SignUpFormData) => {
    setPending(true);
    setError(null);
    setImageError(null);

    // Image validation before submission (commented out since image upload is disabled)
    // if (!image) {
    //   setImageError("Profile photo is required");
    //   setPending(false);
    //   return;
    // }

    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("password", data.password);
      formData.append("name", data.name);
      // formData.append("bio", data.bio);
      // formData.append("avatarUrl", image);

      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        credentials: "include", // Important for cookies
        body: formData,
      });

      console.log("📡 Response status:", response.status);
      console.log("📦 Response headers:", [...response.headers.entries()]);

      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(
          `Server error (${response.status}): ${errorText.substring(0, 100)}...`
        );
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message);
      } else {
        // Store tokens in localStorage as backup (same as login)
        if (responseData.data.accessToken) {
          localStorage.setItem("accessToken", responseData.data.accessToken);
        }
        if (responseData.data.refreshToken) {
          localStorage.setItem("refreshToken", responseData.data.refreshToken);
        }

        // Dispatch user data to Redux store
        dispatch(setUser(responseData.data.user));

        console.log("✅ Registration successful, redirecting to home");
        // Redirect to user's home page instead of sign-in
        router.push(`/${responseData.data.user.username}/home`);
      }
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as any).message === "string"
      ) {
        console.log("Error during sign up:", (error as any).message);
        setError((error as any).message);
      } else {
        console.log("Error during sign up:", error);
        setError("Unknown error");
      }
    } finally {
      setPending(false);
    }
  };

  // Form handler that manages navigation between steps
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNext) {
      // First step - just go to next step
      setIsNext(true);
    } else {
      // Second step - actually submit the form
      handleSubmit(submitForm)(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col space-y-10 justify-center items-center bg-neutral-50 dark:bg-neutral-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center pt-6">
        <Image
          className="w-[200px] dark:invert dark:brightness-0 dark:saturate-0"
          src={logo}
          alt=""
        />
      </div>
      <Card className="w-full max-w-md rounded-xl shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="px-4 sm:px-6 pt-6 pb-4">
          <CardTitle className="text-lg sm:text-xl text-neutral-900 dark:text-white text-center">
            Sign Up
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 text-center">
            Create Your Account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleFormSubmit} noValidate>
            <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
              {/* Left side inputs */}
              <div className="w-full">
                {!isNext && (
                  <>
                    <div className="mb-4 flex flex-col">
                      <label
                        htmlFor="username"
                        className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                      >
                        Username
                      </label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        disabled={pending}
                        autoFocus
                        {...register("username", {
                          required: "Username is required",
                        })}
                        autoComplete="off"
                        className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 text-sm sm:text-base h-10 sm:h-11 ${errors.username ? "border-red-500 dark:border-red-500" : ""}`}
                      />
                      {errors.username && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="mb-4 flex flex-col">
                      <label
                        htmlFor="name"
                        className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                      >
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        disabled={pending}
                        {...register("name", { required: "Name is required" })}
                        autoComplete="off"
                        className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 text-sm sm:text-base h-10 sm:h-11 ${errors.name ? "border-red-500 dark:border-red-500" : ""}`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
                {isNext && (
                  <>
                    <div className="mb-4 flex flex-col">
                      <label
                        htmlFor="password"
                        className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                      >
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        disabled={pending}
                        {...register("password", {
                          required: "Password is required",
                        })}
                        autoComplete="off"
                        className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 text-sm sm:text-base h-10 sm:h-11 ${errors.password ? "border-red-500 dark:border-red-500" : ""}`}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="mb-4 flex flex-col">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                      >
                        Confirm Password
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        disabled={pending}
                        {...register("confirmPassword", {
                          required: "Confirm Password is required",
                          validate: (value) =>
                            value === password || "Passwords do not match",
                        })}
                        autoComplete="off"
                        className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 text-sm sm:text-base h-10 sm:h-11 ${errors.confirmPassword ? "border-red-500 dark:border-red-500" : ""}`}
                      />
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* General error */}
            {error && (
              <p className="text-red-500 text-xs sm:text-sm mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </p>
            )}

            {/* Submit Button */}
            {isNext && (
              <LoadingButton
                pending={pending}
                className="mb-2 h-10 sm:h-12 text-sm sm:text-base w-full"
                type="submit"
              >
                Signup
              </LoadingButton>
            )}

            <Button
              onClick={(e) => {
                e.preventDefault();
                setIsNext(!isNext);
              }}
              className=" h-10 sm:h-12 text-sm sm:text-base w-full dark:bg-neutral-700 dark:hover:bg-neutral-100 dark:hover:text-black duration-300 dark:text-white"
              type="button"
            >
              {!isNext ? "Next" : "Back"}
            </Button>

            {/* Link to sign in */}
            <div className="mt-4 text-center">
              <Link
                href="/sign-in"
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
