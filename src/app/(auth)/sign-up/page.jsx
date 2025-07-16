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
import { setUser } from "@/redux/slice/userSlice.js";
import { API_ENDPOINTS } from "@/lib/api";

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    setError: setFormError,
    clearErrors,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const handleImageClick = () => {
    inputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFormError("avatarUrl", {
          type: "manual",
          message: "Please select a valid image file.",
        });
        return;
      }
      setImage(file);
      clearErrors("avatarUrl");
    }
  };

  const onSubmit = async (data) => {
    setPending(true);
    setError(null);

    // Image validation before submission
    if (!image) {
      setFormError("avatarUrl", {
        type: "manual",
        message: "Profile photo is required",
      });
      setPending(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("password", data.password);
      formData.append("name", data.name);
      formData.append("bio", data.bio);
      formData.append("avatarUrl", image);

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
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}...`);
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message);
      } else {
        // Store tokens in localStorage as backup (same as login)
        if (responseData.data.accessToken) {
          localStorage.setItem('accessToken', responseData.data.accessToken);
        }
        if (responseData.data.refreshToken) {
          localStorage.setItem('refreshToken', responseData.data.refreshToken);
        }
        
        // Dispatch user data to Redux store
        dispatch(setUser(responseData.data.user));
        
        console.log("✅ Registration successful, redirecting to home");
        // Redirect to user's home page instead of sign-in
        router.push(`/${responseData.data.user.username}/home`);
      }
    } catch (error) {
      console.log("Error during sign up:", error.message);
      setError(error.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-50 dark:bg-neutral-900 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-4xl rounded-xl shadow-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
        <CardHeader className="px-4 sm:px-6 pt-6 pb-4">
          <CardTitle className="text-lg sm:text-xl text-neutral-900 dark:text-white text-center">Sign Up</CardTitle>
          <CardDescription className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 text-center">Create Your Account</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
              {/* Left side inputs */}
              <div className="w-full lg:w-1/2">
                {["username", "name", "bio", "password", "confirmPassword"].map((field) => (
                  <div key={field} className="mb-4 flex flex-col">
                    <label htmlFor={field} className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {field === "confirmPassword"
                        ? "Confirm Password"
                        : field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <Input
                      id={field}
                      type={field === "password" || field === "confirmPassword" ? "password" : "text"}
                      placeholder={`Enter your ${field}`}
                      disabled={pending}
                      autoFocus={field === "username"}
                      {...register(field, {
                        required: `${field} is required`,
                        validate:
                          field === "confirmPassword"
                            ? (value) => value === password || "Passwords do not match"
                            : undefined,
                      })}
                      autoComplete="off"
                      className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 text-sm sm:text-base h-10 sm:h-11 ${errors[field] ? "border-red-500 dark:border-red-500" : ""
                        }`}
                    />
                    {errors[field] && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[field].message}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Right side image upload */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <label htmlFor={"avatar"} className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Profile Photo
                </label>
                <div
                  onClick={handleImageClick}
                  className={`${!image ? "border-[1px] border-dashed border-neutral-300 dark:border-neutral-600" : "border-none"
                    } rounded-xl flex items-center justify-center cursor-pointer p-4 bg-white dark:bg-neutral-800 flex-1 min-h-[200px] sm:min-h-[300px] lg:min-h-[400px]`}
                >
                  <div className='w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 rounded-full overflow-hidden relative'>
                    {image ? (
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Profile Preview"
                        className="w-full h-full object-cover bg-center rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
                        <svg
                          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>
                {errors.avatarUrl && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.avatarUrl.message}</p>
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
            <LoadingButton 
              pending={pending} 
              disabled={pending}
              className="mt-6 h-10 sm:h-12 text-sm sm:text-base"
            >
              Sign up
            </LoadingButton>

            {/* Link to sign in */}
            <div className="mt-4 text-center">
              <Link href="/sign-in" className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm">
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
