"use client";
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingButton from "@/components/Loadingbutton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import addImage from "@/assets/addImage.png";
import Image from "next/image";

const page = () => {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    const inputRef = useRef(null);

    const handleImageClick = () => {
        inputRef.current.click();
    }

    const onSubmit = async (data) => {
        setPending(true); // Set loading state
        try {
            const response = await fetch("http://localhost:5000/api/setupprofile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.name,
                    username: data.username,
                    bio: data.bio,
                    avatarUrl: data.avatarUrl,
                }),
            });

            const responseData = await response.json();
            console.log(responseData);
            if (!responseData.success) {
                throw new Error(responseData.message);
            } else {
                router.push("/sign-in");
                reset();
            }
        } catch (error) {
            console.log("Error during sign up : ", error.message);
        } finally {
            setPending(false);
        }
    };

    return (
        <div>
            <div className="h-screen flex justify-center items-center">
                <Card className="min-w-[50%] rounded-xl shadow-md">
                    <CardHeader>
                        <CardTitle>Setup Profile</CardTitle>
                        <CardDescription>Set Your Profile And Get Going !</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="flex justify-between items-start space-x-10 borde "
                            onSubmit={handleSubmit(onSubmit)} noValidate >
                            <div className="w-full">
                                {["name", "username", "bio"].map((field) => (
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
                                            type={"text"}
                                            placeholder={`Enter your ${field}`}
                                            {...register(field, {
                                                required: `${field} is required`,

                                            })}
                                            autoComplete="off"
                                            className={`mt-1 block w-full ${errors[field] ? "border-red-500" : "border-gray-300"
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
                                    Complete Setup
                                </LoadingButton>
                            </div>
                            <div className="space-y-1 w-full flex flex-col h-full ">
                                <label
                                    htmlFor={"avatarUrl"}
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Profile Photo
                                </label>
                                <div onClick={handleImageClick} className="border-dashed border-gray-300 border-[1px] rounded-xl  ">
                                    <Image className="fill-white" src={addImage} alt="" />
                                    <input ref={inputRef} type="file" className="" />
                                </div>
                            </div>

                        </form>
                        {/* <div className="mt-4 text-center text-sm">
                            <Link href="/sign-in" className="text-primary hover:underline">
                                Already have an account? Sign in
                            </Link>
                        </div> */}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}

export default page
