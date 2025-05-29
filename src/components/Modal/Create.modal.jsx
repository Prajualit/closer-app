import { useState, useRef, useEffect } from "react";
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


const CreateModal = ({ nav, activeNav }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
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

        try {
            const response = await fetch("http://localhost:5000/api/v1/create", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json(); 
                console.log("File uploaded successfully");
                setFile(null);
                setPreviewUrl(null);

                dispatch(updateUser({ media: data.data.media })); 
            } else {
                console.error("Failed to upload file");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };


    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    className={`transition-all duration-300 flex items-center space-x-2 rounded-[8px] px-5 py-3 hover:bg-[#efefef] focus:bg-neutral-100 focus:text-black w-full ${activeNav === nav.name.toLowerCase()
                        ? "text-black"
                        : "text-neutral-500"
                        }`}
                >
                    {nav.icon}
                    <span>{nav.name}</span>
                </button>
            </DialogTrigger>

            <DialogContent className="bg-white h-[80%] w-[40%]">
                <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <DialogDescription className="flex flex-col space-y-5 justify-center items-center text-lg text-black">
                    <MediaIcon />
                    Upload a photo or video
                </DialogDescription>

                <DialogFooter className="flex flex-col items-center justify-center">
                    <div className="py-4 flex flex-col items-center space-y-3">
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
                            className="rounded-[8px] hover:bg-black hover:text-white text-black duration-300"
                        >
                            {file ? "Change File" : "Select from Computer"}
                        </Button>

                        {file && (
                            <>
                                <p className="text-sm text-neutral-500">Selected: {file.name}</p>

                                {/* Preview Image or Video */}
                                {previewUrl && file.type.startsWith("image/") && (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-w-xs max-h-48 rounded-md mt-2 object-contain"
                                    />
                                )}
                                {previewUrl && file.type.startsWith("video/") && (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="max-w-xs max-h-48 rounded-md mt-2"
                                    />
                                )}
                            </>
                        )}

                        <Button
                            className="mt-2 bg-black text-white rounded-[8px] hover:bg-neutral-800"
                            onClick={handleSubmitFile}
                            disabled={!file}
                        >
                            Upload
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateModal;
