"use client";
import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import LoadingButton from "@/components/Loadingbutton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import addImage from "@/assets/addImage.png";
import Image from "next/image";

const Page = () => {
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

      const response = await fetch("http://localhost:5000/api/v1/users/register", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message);
      } else {
        router.push("/sign-in");
      }
    } catch (error) {
      console.log("Error during sign up:", error.message);
      setError(error.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center">
      <Card className="w-full max-w-[60%] rounded-xl shadow-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create Your Account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex space-x-5">
              {/* Left side inputs */}
              <div className="w-full">
                {["username", "name", "bio", "password", "confirmPassword"].map((field) => (
                  <div key={field} className="mb-4 flex flex-col">
                    <label htmlFor={field} className="block text-sm font-medium text-gray-700">
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
                      className={`mt-1 block w-full ${errors[field] ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors[field] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field].message}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Right side image upload */}
              <div className="space-y-1 w-full flex flex-col h-full">
                <label htmlFor={"avatar"} className="block text-sm font-medium text-gray-700">
                  Profile Photo
                </label>
                <div
                  onClick={handleImageClick}
                  className={`${!image ? "border-[1px]" : "border-none"
                    } border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer p-4`}
                >
                  <div className='w-[100px] h-[100px] rounded-full overflow-hidden relative'>
                    {image ? (
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Profile Preview"
                        className="w-[100px] h-[100px] object-cover rounded-full"
                      />
                    ) : (
                      <Image src={addImage} width={100} height={100} alt="Add Image" className="w-[100px] h-[100px]" />
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
                  <p className="text-red-500 text-sm mt-1">{errors.avatarUrl.message}</p>
                )}
              </div>
            </div>

            {/* General error */}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            {/* Submit Button */}
            <LoadingButton pending={pending} disabled={pending}>
              Sign up
            </LoadingButton>

            {/* Link to sign in */}
            <div className="mt-2 text-center text-sm">
              <Link href="/sign-in" className="text-primary hover:underline">
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
