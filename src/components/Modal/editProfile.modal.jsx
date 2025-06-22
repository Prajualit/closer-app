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
        watch,
        setError: setFormError,
        clearErrors,
        formState: { errors },
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
            formData.append("name", data.name);
            formData.append("bio", data.bio);
            formData.append("avatarUrl", image);

            const response = await fetch("http://localhost:5000/api/v1/users/update-profile", {
                method: "POST",
                body: formData,
            });

            const responseData = await response.json();
            if (!responseData.success) {
                throw new Error(responseData.message);
            } else {
                console.log("Profile Updated successfully");
                dispatch(updateUser(responseData.data.user));
                setImage(null);
                inputRef.current.value = null;
            }
        } catch (error) {
            console.log("Error during sign up:", error.message);
            setError(error.message);
        } finally {
            setPending(false);
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
                                                        required: `${field} is required`,
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
                                            Profile Photo
                                        </label>
                                        <div
                                            onClick={handleImageClick}
                                            className={`${!image ? "border-[1px]" : "border-none"
                                                } border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer p-4 `}
                                        >
                                            {image ? (
                                                <img
                                                    src={URL.createObjectURL(image)}
                                                    alt="Profile Preview"
                                                    className="w-[170px] h-[170px] object-cover rounded-full"
                                                />
                                            ) : (
                                                <Image src={addImage} width={100} height={100} alt="Add Image" className="w-[166px] h-[166px]" />
                                            )}
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
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default EditModal;