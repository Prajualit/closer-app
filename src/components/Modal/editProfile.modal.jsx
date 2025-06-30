import { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import LoadingButton from "@/components/Loadingbutton";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { updateUser } from "@/redux/slice/userSlice.js";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import addImage from "@/assets/addImage.png";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

const EditModal = ({ nav, activeNav }) => {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [image, setImage] = useState(null);
    const inputRef = useRef(null);
    const [changePassword, setChangePassword] = useState(false);
    const [passwordStep, setPasswordStep] = useState(1); // 1: current password, 2: new password
    const [isOpen, setIsOpen] = useState(false);
    const [currentPasswordValue, setCurrentPasswordValue] = useState(""); // Store current password

    const dispatch = useDispatch();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        setError: setFormError,
        clearErrors,
        formState: { errors },
        reset,
        watch,
    } = useForm();

    const resetModal = () => {
        setChangePassword(false);
        setPasswordStep(1);
        setError(null);
        setImage(null);
        setCurrentPasswordValue("");
        clearErrors();
        reset();
        if (inputRef.current) {
            inputRef.current.value = null;
        }
    };

    const handleModalOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            resetModal();
        }
    };

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

        try {
            const formData = new FormData();

            // Only append fields that have values
            if (data.username && data.username.trim()) {
                formData.append("username", data.username.trim());
            }

            if (data.name !== undefined && data.name !== null) {
                formData.append("name", data.name);
            }

            if (data.bio !== undefined && data.bio !== null) {
                formData.append("bio", data.bio);
            }

            // Only append avatar if a new image is selected
            if (image) {
                formData.append("avatarUrl", image);
            }

            // Check if at least one field is being updated
            if (!formData.has("username") && !formData.has("name") && !formData.has("bio") && !formData.has("avatarUrl")) {
                setError("Please update at least one field");
                setPending(false);
                return;
            }

            const response = await fetch("http://localhost:5000/api/v1/users/update-profile", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error(responseData.message);
            } else {
                console.log("Profile Updated successfully");
                dispatch(updateUser(responseData.data.user));
                toast({
                    title: "Profile Updated",
                    description: "Your profile has been successfully updated.",
                    variant: "success",
                });
                setImage(null);
                if (inputRef.current) {
                    inputRef.current.value = null;
                }
            }
        } catch (error) {
            console.log("Error during profile update:", error.message);
            setError(error.message);
        } finally {
            setPending(false);
            setImage(null);
            clearErrors();
            reset({
                username: '',
                name: '',
                bio: ''
            });
            if (inputRef.current) {
                inputRef.current.value = null;
            }
        }
    };

    const onSubmitPassword = async (data) => {
        setPending(true);
        setError(null);

        try {
            if (passwordStep === 1) {
                // Verify current password
                const response = await fetch("http://localhost:5000/api/v1/users/verify-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword: data.currentPassword,
                    }),
                    credentials: "include",
                });

                const responseData = await response.json();
                if (!responseData.success) {
                    throw new Error(responseData.message);
                } else {
                    // Store current password and move to step 2
                    setCurrentPasswordValue(data.currentPassword);
                    setPasswordStep(2);
                    reset(); // Clear form for step 2
                }
            } else {
                // Change password (step 2)
                const response = await fetch("http://localhost:5000/api/v1/users/change-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword: currentPasswordValue,
                        newPassword: data.newPassword,
                    }),
                    credentials: "include",
                });

                const responseData = await response.json();
                if (!responseData.success) {
                    throw new Error(responseData.message);
                } else {
                    console.log("Password changed successfully");
                    toast({
                        title: "Password Changed",
                        description: "Your password has been successfully updated.",
                        variant: "success",
                    });
                    resetModal();
                }
            }
        } catch (error) {
            console.log("Error during password operation:", error.message);
            setError(error.message);
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
            <DialogTrigger asChild>
                <button className="flex items-center group justify-center border rounded-[5px] px-5 py-2 !w-fit hover:bg-neutral-100 transition-all duration-300">Edit Profile</button>
            </DialogTrigger>

            <DialogContent className="bg-white  w-[40%] ">
                <VisuallyHidden>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Edit Profile</DialogTitle>
                    </DialogHeader>
                </VisuallyHidden>
                <div className="text-sm h-full">
                    <Card className="w-full h-full border-none shadow-none">
                        <CardHeader>
                            <CardTitle>
                                {changePassword
                                    ? (passwordStep === 1 ? "Verify Current Password" : "Set New Password")
                                    : "Edit Profile"
                                }
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                                {changePassword
                                    ? (passwordStep === 1
                                        ? "Please enter your current password to continue."
                                        : "Enter your new password and confirm it."
                                    )
                                    : "You need to fill in at least one field to update your profile."
                                }
                            </p>
                        </CardHeader>
                        <CardContent>
                            {!changePassword ? (
                                <form noValidate onSubmit={handleSubmit(onSubmit)}>
                                    <div className="flex space-x-5 ">
                                        <div className="w-full flex flex-col h-full">
                                            {["username", "name", "bio"].map((field) => (
                                                <div key={field} className="mb-4 flex flex-col">
                                                    <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                                    </label>
                                                    <Input
                                                        id={field}
                                                        type={"text"}
                                                        placeholder={`Enter your ${field}`}
                                                        disabled={pending}
                                                        autoFocus={field === "username"}
                                                        {...register(field, {
                                                            validate: (value) => {
                                                                if (field === "username" && value && value.trim().length === 0) {
                                                                    return "Username cannot be empty spaces";
                                                                }
                                                                return true;
                                                            }
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

                                        <div className="space-y-1 w-full flex flex-col h-full">
                                            <label htmlFor={"avatar"} className="block text-sm font-medium text-gray-700">
                                                Profile Photo <span className="text-gray-500 text-xs">(Optional)</span>
                                            </label>
                                            <div
                                                onClick={handleImageClick}
                                                className={`${!image ? "border-[1px]" : "border-none"
                                                    } border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer p-4 `}
                                            >
                                                <div className='w-[166px] h-[166px] rounded-full overflow-hidden relative'>
                                                    {image ? (
                                                        <img
                                                            src={URL.createObjectURL(image)}
                                                            alt="Profile Preview"
                                                            className="w-[166px] h-[166px] object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <Image src={addImage} width={100} height={100} alt="Add Image" className="w-[166px] h-[166px]" />
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
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                    <LoadingButton className="mt-3" pending={pending} disabled={pending}>
                                        Update Profile
                                    </LoadingButton>
                                </form>
                            ) : (
                                <form noValidate onSubmit={handleSubmit(onSubmitPassword)}>
                                    <div className="flex flex-col space-y-4">
                                        {passwordStep === 1 ? (
                                            // Step 1: Current Password
                                            <>
                                                <Input
                                                    type="password"
                                                    placeholder="Current Password"
                                                    {...register("currentPassword", { required: "Current password is required" })}
                                                    className={`mt-1 block w-full ${errors.currentPassword ? "border-red-500" : "border-gray-300"}`}
                                                />
                                                {errors.currentPassword && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                                                )}
                                            </>
                                        ) : (
                                            // Step 2: New Password and Confirm
                                            <>
                                                <Input
                                                    type="password"
                                                    placeholder="New Password"
                                                    {...register("newPassword", { required: "New password is required" })}
                                                    className={`mt-1 block w-full ${errors.newPassword ? "border-red-500" : "border-gray-300"}`}
                                                />
                                                {errors.newPassword && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                                                )}

                                                <Input
                                                    type="password"
                                                    placeholder="Confirm New Password"
                                                    {...register("confirmNewPassword", {
                                                        validate: (value) => value === watch("newPassword") || "Passwords do not match",
                                                        required: "Please confirm your new password"
                                                    })}
                                                    className={`mt-1 block w-full ${errors.confirmNewPassword ? "border-red-500" : "border-gray-300"}`}
                                                />
                                                {errors.confirmNewPassword && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.confirmNewPassword.message}</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                    <LoadingButton className="flex-1 mt-3" pending={pending} disabled={pending}>
                                        {passwordStep === 1 ? "Verify Password" : "Update Password"}
                                    </LoadingButton>

                                </form>
                            )}
                            {changePassword && passwordStep === 2 && (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setPasswordStep(1);
                                        setCurrentPasswordValue("");
                                        reset();
                                        clearErrors();
                                    }}
                                    className="mt-3 w-full bg-gray-200 text-black rounded-[8px] hover:bg-gray-300"
                                >
                                    Back to Current Password
                                </Button>
                            )}
                            <Button
                                type="button"
                                onClick={() => {
                                    if (changePassword) {
                                        resetModal();
                                    } else {
                                        setChangePassword(true);
                                    }
                                }}
                                className="mt-3 w-full bg-[#f7f7f7] shadow-md text-black rounded-[8px] transition-colors duration-300 hover:text-white hover:bg-[#cb3a3a]"
                            >
                                {changePassword ? "Cancel" : "Change Password"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog >
    )
}

export default EditModal;