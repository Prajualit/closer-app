'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import NextImage from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/redux/slice/userSlice';
import ImageModal from '@/components/Modal/viewMedia.modal.jsx';

const Photos = () => {
  const user = useSelector((state) => state.user.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeImageUrl, setActiveImageUrl] = useState(null);

  const inputRef = React.useRef(null);
  const dispatch = useDispatch();

  const hasPhotos =
    Array.isArray(user?.media) &&
    user.media.some((item) => item.resource_type === "image");

  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/v1/create', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(updateUser({ media: data.data.media }));
        setIsModalOpen(false);
        setFile(null);
        setPreviewUrl(null);
      } else {
        console.error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const ProfileShareIcon = ({ size = 62, color = "currentColor" }) => {
    return (
      <svg
        aria-label="When you share photos, they will appear on your profile."
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 96 96"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>When you share photos, they will appear on your profile.</title>
        <circle
          cx="48"
          cy="48"
          r="47"
          fill="none"
          stroke={color}
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        <ellipse
          cx="48.002"
          cy="49.524"
          rx="10.444"
          ry="10.476"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="2.095"
        />
        <path
          d="M63.994 69A8.02 8.02 0 0 0 72 60.968V39.456a8.023 8.023 0 0 0-8.01-8.035h-1.749a4.953 4.953 0 0 1-4.591-3.242C56.61 25.696 54.859 25 52.469 25h-8.983c-2.39 0-4.141.695-5.181 3.178a4.954 4.954 0 0 1-4.592 3.242H32.01a8.024 8.024 0 0 0-8.012 8.035v21.512A8.02 8.02 0 0 0 32.007 69Z"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  };

  const activeMedia = user?.media?.find((m) => m.url === activeImageUrl);


  return (
    <>
      {hasPhotos ? (
        <div className="grid grid-cols-3 items-center justify-center gap-2">
          {user?.media
            ?.filter((m) => m.resource_type === "image")
            .map((m, i) => {
              const SmartImage = ({ src, alt = "Image", containerClass = "" }) => {
                const [isPortrait, setIsPortrait] = useState(false);

                useEffect(() => {
                  const img = new window.Image(); // native Image constructor
                  img.onload = () => {
                    setIsPortrait(img.naturalWidth < img.naturalHeight);
                  };
                  img.src = src;
                }, [src]);


                return (
                  <div className={`h-[12.5rem] w-[12.5rem] bg-[#181818] flex items-center justify-center overflow-hidden ${containerClass}`}>
                    <NextImage
                      src={src}
                      alt={alt}
                      height={200}
                      width={200}
                      className={`w-full h-full ${isPortrait ? "object-cover" : "object-contain"}`}
                    />
                  </div>
                );
              };
              return (
                <div
                  key={i}
                  className='group relative h-[12.5rem] w-[12.5rem] '
                  onClick={() => setActiveImageUrl(m.url)}
                >
                  <div className='absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer '></div>
                  <div className='bg-[#181818] h-full flex items-center justify-center transition-transform duration-200 '>
                    <SmartImage src={m.url} alt={`image-${i}`} />
                  </div>
                </div>
              )
            })}
          <ImageModal
            imageUrl={activeMedia}
            onClose={() => setActiveImageUrl(null)}
            user={user}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-5">
          <ProfileShareIcon size={100} color="black" />
          <h1 className="text-2xl font-semibold">No Photos Yet</h1>
          <p className="text-neutral-500">
            When you share photos, they will appear on your profile.
          </p>
          <Button
            className="rounded-[8px] hover:text-[#474747] transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            Share your first photo
          </Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white h-[80%] w-[40%]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col items-center space-y-5 text-lg text-black">
            <span>Upload a photo or video</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="rounded-[8px] text-black"
            >
              {file ? 'Change File' : 'Select from Computer'}
            </Button>
            {file && (
              <>
                <span className="text-sm text-neutral-500">Selected: {file.name}</span>
                {previewUrl && file.type.startsWith('image/') && (
                  <NextImage
                    height={200}
                    width={200}
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-xs max-h-48 rounded-md mt-2 object-contain"
                  />
                )}
              </>
            )}
            <Button
              className="mt-2 bg-black text-white rounded-[8px] hover:bg-neutral-800"
              onClick={handleFileUpload}
              disabled={!file}
            >
              Upload
            </Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Photos;


