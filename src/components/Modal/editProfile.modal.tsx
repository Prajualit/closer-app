import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { updateUser } from "@/redux/slice/userSlice.js";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";

interface EditModalProps {
  nav?: { name: string; icon: React.ReactElement };
  activeNav?: string;
}

const EditModal: React.FC<EditModalProps> = ({ nav, activeNav }) => {
    const [pending, setPending] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [changePassword, setChangePassword] = useState<boolean>(false);
    const [passwordStep, setPasswordStep] = useState<number>(1); // 1: current password, 2: new password
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [currentPasswordValue, setCurrentPasswordValue] = useState<string>(""); // Store current password

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

    const resetModal = (): void => {
        setChangePassword(false);
        setPasswordStep(1);
        setError(null);
        setImage(null);
        setCurrentPasswordValue("");
        clearErrors();
        reset();
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleModalOpenChange = (open: boolean): void => {
        setIsOpen(open);
        if (!open) {
            resetModal();
        }
    };

    const handleImageClick = (): void => {
        if (inputRef.current) {
            inputRef.current.click();
            inputRef.current.value = "";
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
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

    const onSubmit = async (data: any): Promise<void> => {
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

            const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
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
                    inputRef.current.value = "";
                }
            }
        } catch (error) {
            if (typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string") {
                console.log("Error during profile update:", (error as any).message);
                setError((error as any).message);
            } else {
                console.log("Error during profile update:", error);
                setError("Unknown error");
            }
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
                inputRef.current.value = "";
            }
        }
    };

    const onSubmitPassword = async (data: any): Promise<void> => {
        setPending(true);
        setError(null);

        try {
            if (passwordStep === 1) {
                // Verify current password
                const response = await fetch(API_ENDPOINTS.VERIFY_PASSWORD, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword: data.currentPassword
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
                const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
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
            if (typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string") {
                console.log("Error during password operation:", (error as any).message);
                setError((error as any).message);
            } else {
                console.log("Error during password operation:", error);
                setError("Unknown error");
            }
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
            <DialogTrigger asChild>
                <button className="flex items-center group justify-center border border-neutral-200 dark:border-neutral-700 rounded-[5px] px-3 sm:px-5 py-2 !w-fit hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm sm:text-base">
                    <span className="inline">Edit Profile</span>
                </button>
            </DialogTrigger>

            <DialogContent className="bg-white dark:bg-neutral-900 w-[95vw] sm:w-[85vw] md:w-[70vw] lg:w-[50vw] xl:w-[40vw] max-w-2xl border-neutral-200 dark:border-neutral-700 h-fit  max-h-[95vh] overflow-hidden flex flex-col">
                <VisuallyHidden>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">Edit Profile</DialogTitle>
                    </DialogHeader>
                </VisuallyHidden>
                <div className="text-sm h-full flex flex-col">
                    <Card className="w-full h-full border-none shadow-none bg-white dark:bg-neutral-900 flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle className="text-neutral-900 dark:text-white">
                                {changePassword
                                    ? (passwordStep === 1 ? "Verify Current Password" : "Set New Password")
                                    : "Edit Profile"
                                }
                            </CardTitle>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {changePassword
                                    ? (passwordStep === 1
                                        ? "Please enter your current password to continue."
                                        : "Enter your new password and confirm it."
                                    )
                                    : "You need to fill in at least one field to update your profile."
                                }
                            </p>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto px-4 sm:px-6">
                            {!changePassword ? (
                                <form noValidate onSubmit={handleSubmit(onSubmit)}>
                                    {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:space-x-10 space-y-8 lg:space-y-0 w-full">
                                        {/* Profile Photo Section - Left on desktop */}
                                        <div className="flex flex-col items-center w-full lg:w-[220px] flex-shrink-0">
                                            <label htmlFor="avatar" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                                Profile Photo <span className="text-neutral-500 dark:text-neutral-400 text-xs">(Optional)</span>
                                            </label>
                                            <div
                                                onClick={handleImageClick}
                                                className={`${!image ? "border-[1.5px] border-dashed border-neutral-300 dark:border-neutral-600" : "border-none"} rounded-xl flex items-center justify-center cursor-pointer p-3 sm:p-4 bg-white dark:bg-neutral-800 transition-shadow hover:shadow-lg`}
                                            >
                                                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-[166px] lg:h-[166px] rounded-full overflow-hidden relative">
                                            {image ? (
                                                <Image
                                                    src={URL.createObjectURL(image)}
                                                    alt="Profile Preview"
                                                    width={166}
                                                    height={166}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
                                                            <svg
                                                                className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 dark:text-neutral-500"
                                                                fill="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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
                                            {errors.avatarUrl && typeof errors.avatarUrl.message === "string" && (
                                                <p className="text-red-500 text-sm mt-1">{errors.avatarUrl.message}</p>
                                            )}
                                        </div>

                                        {/* Form Fields Section - Right on desktop */}
                                        <div className="flex-1 flex flex-col justify-center w-full max-w-xl mx-auto">
                                            {['username', 'name', 'bio'].map((field) => (
                                                <div key={field} className="mb-4 flex flex-col">
                                                    <label htmlFor={field} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                                    </label>
                                                    <Input
                                                        id={field}
                                                        type="text"
                                                        placeholder={`Enter your ${field}`}
                                                        disabled={pending}
                                                        autoFocus={field === 'username'}
                                                        {...register(field, {
                                                            validate: (value) => {
                                                                if (field === 'username' && value && value.trim().length === 0) {
                                                                    return 'Username cannot be empty spaces';
                                                                }
                                                                return true;
                                                            }
                                                        })}
                                                        autoComplete="off"
                                                        className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 ${errors[field] ? 'border-red-500 dark:border-red-500' : ''}`}
                                                    />
                                                    {errors[field] && typeof errors[field].message === "string" && (
                                                        <p className="text-red-500 text-sm mt-1">{errors[field].message}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                    <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                        <LoadingButton className="w-full" pending={pending}>
                                            Update Profile
                                        </LoadingButton>
                                    </div>
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
                                                    className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 ${errors.currentPassword ? "border-red-500 dark:border-red-500" : ""}`}
                                                />
                                                {errors.currentPassword && typeof errors.currentPassword.message === "string" && (
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
                                                    className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 ${errors.newPassword ? "border-red-500 dark:border-red-500" : ""}`}
                                                />
                                                {errors.newPassword && typeof errors.newPassword.message === "string" && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                                                )}

                                                <Input
                                                    type="password"
                                                    placeholder="Confirm New Password"
                                                    {...register("confirmNewPassword", {
                                                        validate: (value) => value === watch("newPassword") || "Passwords do not match",
                                                        required: "Please confirm your new password"
                                                    })}
                                                    className={`mt-1 block w-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-600 ${errors.confirmNewPassword ? "border-red-500 dark:border-red-500" : ""}`}
                                                />
                                                {errors.confirmNewPassword && typeof errors.confirmNewPassword.message === "string" && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.confirmNewPassword.message}</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                    <LoadingButton className="flex-1 mt-3" pending={pending}>
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
                                    className="mt-3 w-full bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-[8px] hover:bg-neutral-300 dark:hover:bg-neutral-600"
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
                                className="mt-3 w-full bg-neutral-100 dark:bg-neutral-800 shadow-md text-neutral-900 dark:text-white rounded-[8px] transition-colors duration-300 hover:text-white hover:bg-red-500 dark:hover:bg-red-500"
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