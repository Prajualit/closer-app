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
import { useForm } from "react-hook-form";
import addImage from "@/assets/addImage.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

const page = () => {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [image, setImage] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const inputRef = useRef(null);

    // Trigger file input when clicking on the image
    const handleImageClick = () => {
        inputRef.current.click();
    };

    // Handle file input changes
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    // Form submit handler
    const onSubmit = async (data) => {
        setPending(true); // Set loading state
        try {
            // Use FormData to handle file uploads
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("username", data.username);
            formData.append("bio", data.bio);
            if (image) {
                formData.append("avatar", image);
            }

            const response = await fetch("http://localhost:5000/api/setupprofile", {
                method: "POST",
                body: formData,
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
            console.log("Error during setup: ", error.message);
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="h-screen flex justify-center items-center">
            <Card className="min-w-[50%] rounded-xl shadow-md">
                <CardHeader>
                    <CardTitle>Setup Profile</CardTitle>
                    <CardDescription>Set Your Profile And Get Going!</CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        className="flex flex-col justify-between items-start space-y-5"
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                    >
                        <div className="w-full h-full space-x-5 justify-center flex">
                            {/* Input Fields */}
                            <div className="w-full">
                                {["name", "username", "bio"].map((field) => (
                                    <div key={field} className="mb-4">
                                        <label
                                            htmlFor={field}
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                        </label>
                                        <Input
                                            as={field === "bio" ? "textarea" : "input"}
                                            id={field}
                                            type="text"
                                            placeholder={`Enter your ${field}`}
                                            {...register(field, {
                                                required: `${field} is required`,
                                            })}
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
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-1 w-full flex flex-col h-full">
                                <label
                                    htmlFor={"avatar"}
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Profile Photo (Optional)
                                </label>
                                <div
                                    onClick={handleImageClick}
                                    className={`${!image ? "border-[1px]" : "border-none"
                                        } border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer`}
                                >
                                    {image ? (
                                        <Image
                                            width={300}
                                            height={300}
                                            className="object-cover rounded-full"
                                            src={URL.createObjectURL(image)}
                                            alt="Profile Preview"
                                        />
                                    ) : (
                                        <Image src={addImage} alt="Add Image" />
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: "none" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <LoadingButton pending={pending} disabled={pending}>
                            Complete Setup
                        </LoadingButton>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default page;
