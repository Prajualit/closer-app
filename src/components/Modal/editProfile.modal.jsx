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

const EditModal = ({ nav, activeNav }) => {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [image, setImage] = useState(null);
    const inputRef = useRef(null);

    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        setError: setFormError,
        clearErrors,
        formState: { errors },
        reset,
    } = useForm();

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

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className=" rounded-[8px] hover:text-[#474747] transition-all focus:bg-transparent focus:text-black duration-300 ">Edit Profile</button>
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
                            <CardTitle>Edit Profile</CardTitle>
                            <p className="text-sm text-gray-500">You need to fill in at least one field to update your profile.</p>
                        </CardHeader>
                        <CardContent>
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
                                <Button className="mt-3 w-full bg-[#f7f7f7] shadow-md text-black rounded-[8px] transition-colors duration-300 hover:text-white hover:bg-[#cb3a3a]" >
                                    Change Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog >
    )
}

export default EditModal;