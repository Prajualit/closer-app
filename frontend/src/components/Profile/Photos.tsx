'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import NextImage from 'next/image';
import ImageModal from '@/components/Modal/viewMedia.modal';
import CreateModal from '@/components/Modal/create';
import LoadingButton from '@/components/LoadingButton';

// ## 1. SmartImage Component (Refactored)
// This component is now defined once outside the main component to improve performance.
interface MediaItem {
  url: string;
  resource_type: string;
  [key: string]: any;
}

interface UserType {
  _id?: string;
  media?: MediaItem[];
  [key: string]: any;
}

interface SmartImageProps {
  src: string;
  alt?: string;
}

const SmartImage: React.FC<SmartImageProps> = ({ src, alt = "Image" }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const img = new window.Image(); // Native Image constructor
    img.onload = () => {
      setIsPortrait(img.naturalWidth < img.naturalHeight);
    };
    img.src = src;
  }, [src]);

  return (
    <div className="relative w-full h-full bg-[#181818] dark:bg-black flex items-center justify-center overflow-hidden">
      <NextImage
        src={src}
        alt={alt}
        fill
        className={`${isPortrait ? "object-cover" : "object-contain"}`}
      />
    </div>
  );
};

const Photos: React.FC = () => {
  const user = useSelector((state: { user: { user: UserType } }) => state.user.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const hasPhotos =
    Array.isArray(user?.media) &&
    user.media.some((item: MediaItem) => item.resource_type === "image");

  const ProfileShareIcon: React.FC<{ size?: number; color?: string }> = ({ size = 62, color = "currentColor" }) => (
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

  const activeMedia = user?.media?.find((m: MediaItem) => m.url === activeImageUrl);
  const imageMedia = user?.media?.filter((m: MediaItem) => m.resource_type === "image") || [];

  return (
    <>
      {hasPhotos ? (
        <>
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 items-center justify-center gap-2">
            {imageMedia.reverse().map((m, i) => (
              <div
                key={i}
                className="group relative h-[12.5rem] w-[12.5rem] cursor-pointer"
                onClick={() => setActiveImageUrl(m.url)}
              >
                {/* ## 2. Hover Effect Overlay
                    - `group-hover:opacity-40`: Makes the overlay 40% opaque on hover.
                    - `transition-opacity duration-300`: Adds a smooth fade-in effect.
                */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 group-focus-within:opacity-60 transition-opacity z-10 duration-300" />
                <SmartImage src={m.url} alt={`image-${i}`} />
              </div>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-1 sm:gap-2">
            {imageMedia.reverse().map((m, i) => (
              <div
                key={i}
                className="group relative aspect-square cursor-pointer"
                onClick={() => setActiveImageUrl(m.url)}
              >
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 group-focus-within:opacity-60 transition-opacity z-10 duration-300" />
                <SmartImage src={m.url} alt={`image-${i}`} />
              </div>
            ))}
          </div>

          <ImageModal
            imageUrl={activeMedia}
            onClose={() => setActiveImageUrl(null)}
            user={user && user._id ? user as Required<UserType> : undefined}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-5">
          <ProfileShareIcon size={100} color="currentColor" />
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            No Photos Yet
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            When you share photos, they will appear on your profile.
          </p>
          <LoadingButton
            className="!w-fit"
            onClick={() => setIsCreateModalOpen(true)}
            pending={false}
          >
            Share your first photo
          </LoadingButton>
        </div>
      )}

      <CreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        isMobile={false}
      />
    </>
  );
};

export default Photos;