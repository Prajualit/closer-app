import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import ImageModal from '@/components/Modal/viewMedia.modal';
import CreateModal from '@/components/Modal/create';
import LoadingButton from '@/components/LoadingButton';

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

const Films = () => {
  const user = useSelector((state: { user: { user: UserType } }) => state.user.user);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const hasFilms =
    Array.isArray(user?.media) &&
    user.media.some((item: MediaItem) => item.resource_type === "video");

  const [videoOrientations, setVideoOrientations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.media) return;
    user.media
      .filter((m: MediaItem) => m.resource_type === "video")
      .forEach((media: MediaItem) => {
        const video = document.createElement("video");
        video.src = media.url;
        video.onloadedmetadata = () => {
          const isPortrait = video.videoWidth < video.videoHeight;
          setVideoOrientations((prev) => ({
            ...prev,
            [media.url]: isPortrait,
          }));
        };
      });
  }, [user?.media]);

  const FilmIcon = ({ size = 24, color = "#000000" }) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        role="img"
      >
        <path
          d="M2 7H22"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M2 17H22"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 17L12 7"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M21.5 21.5V2.5H2.5V21.5H21.5Z"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 7L8 3M16 7L16 3"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 21L8 17M16 21L16 17"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const activeMedia = user?.media?.find((m: MediaItem) => m.url === activeVideoUrl);

  // Prepare refs for all videos (React Hook compliant)
  const videoRefs = useRef<Array<React.RefObject<HTMLVideoElement | null>>>([]);

  // Update refs array length when user.media changes
  useEffect(() => {
    const videoCount = user?.media?.filter((m: MediaItem) => m.resource_type === "video").length || 0;
    // Only update if length changes
    if (videoRefs.current.length !== videoCount) {
      videoRefs.current = Array(videoCount)
        .fill(null)
        .map(() => React.createRef<HTMLVideoElement>());
    }
  }, [user?.media]);

  return (
    <>
      {hasFilms ? (
        <>
          {/* Desktop Layout - preserved as requested */}
          <div className="hidden lg:grid lg:grid-cols-3 items-center justify-center gap-2">
            {user?.media
              ?.filter((m: MediaItem) => m.resource_type === "video")
              .map((m: MediaItem, i: number) => {
                const isPortrait = videoOrientations[m.url];
                const videoClass = isPortrait !== undefined
                  ? isPortrait
                    ? "object-cover"
                    : "object-contain"
                  : "object-contain";

                const videoRef = videoRefs.current[i];

                const handleMouseEnter = () => {
                  videoRef.current?.play();
                };

                const handleMouseLeave = () => {
                  videoRef.current?.pause();
                  if (videoRef.current) videoRef.current.currentTime = 0;
                };

                return (
                  <div
                    key={i}
                    className="h-[20rem] w-[12.5rem] group relative cursor-pointer"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setActiveVideoUrl(m.url)}
                  >
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 group-focus-within:opacity-60 cursor-pointer transition-opacity duration-300 "></div>
                    <div className="bg-[#181818] dark:bg-black h-[20rem] w-[12.5rem] flex items-center justify-center transition-transform duration-200">
                      <video
                        ref={videoRef}
                        className={`w-full h-full ${videoClass}`}
                        src={m.url}
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Mobile Layout - responsive design */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-1 sm:gap-2">
            {user?.media
              ?.filter((m: MediaItem) => m.resource_type === "video")
              .map((m: MediaItem, i: number) => {
                const isPortrait = videoOrientations[m.url];
                const videoClass = isPortrait !== undefined
                  ? isPortrait
                    ? "object-cover"
                    : "object-contain"
                  : "object-contain";

                const videoRef = videoRefs.current[i];

                const handleMouseEnter = () => {
                  videoRef.current?.play();
                };

                const handleMouseLeave = () => {
                  videoRef.current?.pause();
                  if (videoRef.current) videoRef.current.currentTime = 0;
                };

                return (
                  <div
                    key={i}
                    className="aspect-[3/4] group relative cursor-pointer"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setActiveVideoUrl(m.url)}
                  >
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 group-focus-within:opacity-60 cursor-pointer transition-opacity duration-300 "></div>
                    <div className="bg-[#181818] dark:bg-black h-full w-full flex items-center justify-center transition-transform duration-200">
                      <video
                        ref={videoRef}
                        className={`w-full h-full ${videoClass}`}
                        src={m.url}
                        muted
                        loop
                        playsInline
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <ImageModal
            videoUrl={activeMedia}
            onClose={() => setActiveVideoUrl(null)}
            user={user && user._id ? user as Required<UserType> : undefined}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-5">
          <FilmIcon size={100} color="black" />
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">No Films Yet</h1>
          <p className="text-neutral-500">When you share films, they will appear on your profile.</p>
          <LoadingButton
            onClick={() => setIsCreateModalOpen(true)}
            className="!w-fit"
            pending={false}
          >
            Share your first film
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

export default Films;



