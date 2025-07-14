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
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS } from "@/lib/api";


const CreateModal = ({ nav, activeNav, open, onOpenChange }) => {
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
                d="m84.8 22.5-6.1 6.9c-.9 1-2.3 1.2-3.5.6l-7.8-3.9c-1.4-.7-3.1-.7-4.5 0l-7.8 3.9c-1.2.6-2.6.4-3.5-.6l-6.1-6.9c-.8-.9-.8-2.3 0-3.2l6.1-6.9c.9-1 2.3-1.2 3.5-.6l7.8 3.9c1.4.7 3.1.7 4.5 0l7.8-3.9c1.2-.6 2.6-.4 3.5.6l6.1 6.9c.8.9.8 2.3 0 3.2z"
                fill={color}
            />
            <path
                d="M15.7 40.3c-.9-1.4-2.5-2.1-4.1-1.7-1.6.4-2.7 1.9-2.7 3.6v13.6c0 2.1 1.7 3.8 3.8 3.8h16.9c1.7 0 3.2-1.1 3.6-2.7.4-1.6-.3-3.2-1.7-4.1l-13.8-12.5z"
                fill={color}
            />
        </svg>
    );

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("picture", file);
        formData.append("caption", caption);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                return;
            }

            const response = await fetch(API_ENDPOINTS.CREATE.UPLOAD, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Upload successful:", data);
                dispatch(updateUser(data.user));
                setFile(null);
                setCaption("");
                onOpenChange(false);
            } else {
                console.error("Upload failed:", response.statusText);
            }
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md mx-auto p-0 border-none rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-center py-3 border-b font-semibold">
                        Create new post
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    {!file ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <MediaIcon />
                            </div>
                            <p className="text-xl">Drag photos and videos here</p>
                            <Button 
                                onClick={() => inputRef.current?.click()}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Select from computer
                            </Button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                {file.type.startsWith("image/") ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <video
                                        src={previewUrl}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="caption" className="text-sm font-medium">
                                    Caption
                                </label>
                                <Input
                                    id="caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Write a caption..."
                                    className="w-full"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFile(null);
                                        setCaption("");
                                    }}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    Share
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateModal;
