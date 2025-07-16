import React, { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { updateUser } from "@/redux/slice/userSlice.js";
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS } from "@/lib/api";


const CreateModal = ({ nav, activeNav, open, onOpenChange, isMobile }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState(""); // Added caption state
    const inputRef = useRef(null);

    const dispatch = useDispatch();

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const MediaIcon = ({ size = 96, color = "currentColor" }) => (
        <svg
            aria-label="Icon to represent media such as images or videos"
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={(size * 77.3) / 96}
            viewBox="0 0 97.6 77.3"
            fill="none"
            role="img"
        >
            <title>Icon to represent media such as images or videos</title>
            <path
                d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z"
                fill={color}
            />
            <path
                d="M84.7 18.4 58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5-2 34c-.3 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.3-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.7.3 8.2 4.3 7.9 8.9z"
                fill={color}
            />
            <path
                d="M78.2 41.6 61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c.7 0 1.4-.2 2-.5l18-9c2.2-1.1 3.1-3.8 2-6-.4-.7-.9-1.3-1.5-1.8zm-1.4 6-18 9c-.4.2-.8.3-1.3.3-.4 0-.9-.2-1.2-.4-.7-.5-1.2-1.3-1.1-2.2l1.2-20.1c.1-.9.6-1.7 1.4-2.1.8-.4 1.7-.3 2.5.1L77 43.3c1.2.8 1.5 2.3.7 3.4-.2.4-.5.7-.9.9z"
                fill={color}
            />
        </svg>
    );

    const handleSubmitFile = async () => {
        if (!file) {
            console.error("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", caption); // Add caption to form data

        try {
            const response = await fetch(API_ENDPOINTS.CREATE_MEDIA, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                console.log("File uploaded successfully");
                setFile(null);
                setPreviewUrl(null);
                setCaption(""); // Reset caption

                dispatch(updateUser({ media: data.data.media }));

                // Close modal if onOpenChange is provided
                if (onOpenChange) {
                    onOpenChange(false);
                }
            } else {
                console.error("Failed to upload file");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {nav && (
                <DialogTrigger asChild>
                    {isMobile ? (
                        <button
                            className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-300 ${
                                activeNav === nav.name.toLowerCase() ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-400"
                            }`}
                        >
                            <div className="mb-1">
                                {React.cloneElement(nav.icon, { size: 20 })}
                            </div>
                            <span className='text-xs font-medium'>{nav.name}</span>
                        </button>
                    ) : (
                        <button
                            className={`transition-all duration-300 flex items-center space-x-2 rounded-[8px] px-5 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-black dark:focus:text-white w-full ${activeNav === nav.name.toLowerCase()
                                ? "text-black dark:text-white"
                                : "text-neutral-500 dark:text-neutral-400"
                                }`}
                        >
                            {nav.icon}
                            <span>{nav.name}</span>
                        </button>
                    )}
                </DialogTrigger>
            )}

            <DialogContent className="bg-white dark:bg-neutral-900 h-[95vh] w-[98vw] sm:h-[85vh] sm:w-[80vw] md:w-[60vw] lg:w-[45vw] xl:w-[35vw] border-neutral-200 dark:border-neutral-700 max-w-none sm:max-w-[600px] p-3 sm:p-6 overflow-y-auto">
                <DialogHeader className="pb-2 sm:pb-4">
                    <DialogTitle className="text-neutral-900 dark:text-white text-base sm:text-lg md:text-xl">Create New Post</DialogTitle>
                </DialogHeader>
                {!file && (
                    <DialogDescription className="flex flex-col space-y-4 sm:space-y-6 justify-center items-center text-sm sm:text-base md:text-lg text-neutral-900 dark:text-white min-h-[150px] sm:min-h-[200px] md:min-h-[250px]">
                        <MediaIcon size={60} />
                        <span className="text-center px-2 sm:px-4">Upload a photo or video</span>
                    </DialogDescription>
                )}
                <DialogFooter className="flex flex-col items-center justify-center pt-2 sm:pt-4">
                    <div className="py-2 sm:py-4 flex flex-col items-center space-y-3 sm:space-y-4 w-full max-h-[60vh] sm:max-h-none overflow-y-auto">
                        {file && (
                            <>
                                <div className="flex flex-col justify-center space-y-3 sm:space-y-4 w-full">
                                    {previewUrl && file.type.startsWith("image/") && (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-w-[250px] max-h-[200px] sm:max-w-[280px] sm:max-h-[280px] md:max-w-[20rem] md:max-h-[20rem] object-contain mx-auto"
                                        />
                                    )}
                                    {previewUrl && file.type.startsWith("video/") && (
                                        <video
                                            src={previewUrl}
                                            controls
                                            className="max-w-[250px] max-h-[200px] sm:max-w-[280px] sm:max-h-[280px] md:max-w-[20rem] md:max-h-[20rem] mx-auto"
                                        />
                                    )}
                                    <div className="w-full px-1 sm:px-2 md:px-0">
                                        <textarea
                                            placeholder="Add a caption"
                                            value={caption}
                                            className="w-full rounded border p-2 text-xs sm:text-sm outline-neutral-400 
                                            dark:bg-neutral-800 dark:text-white dark:border-neutral-700 min-h-[60px] sm:min-h-[80px] resize-none"
                                            onChange={(e) => setCaption(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-500 text-center truncate max-w-full px-2">
                                    Selected: {file.name}
                                </p>
                            </>
                        )}
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 w-full px-1 sm:px-2 md:px-0">
                            <Button
                                className={`bg-black text-white rounded-[8px] hover:bg-neutral-800 ${!file && "hidden"} dark:hover:bg-neutral-200 dark:hover:text-black dark:text-neutral-100 w-full sm:w-auto text-xs sm:text-sm px-3 py-2 sm:px-4`}
                                onClick={handleSubmitFile}
                                disabled={!file}
                            >
                                Upload
                            </Button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <Button
                                variant="outline"
                                onClick={() => inputRef.current?.click()}
                                className="rounded-[8px] hover:bg-black hover:text-white text-black duration-300 dark:hover:bg-neutral-200 dark:hover:text-black dark:text-neutral-100 w-full sm:w-auto text-xs sm:text-sm px-3 py-2 sm:px-4"
                            >
                                {file ? "Change File" : "Select from Computer"}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateModal;
