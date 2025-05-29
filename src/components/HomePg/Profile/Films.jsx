import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '@/redux/slice/userSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Films = () => {
  const user = useSelector((state) => state.user.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = React.useRef(null);
  const dispatch = useDispatch();

  const hasFilms =
    Array.isArray(user?.media) &&
    user.media.some((item) => item.resource_type === "video");

  const [videoOrientations, setVideoOrientations] = useState({});

  useEffect(() => {
    if (!user?.media) return;

    user.media
      .filter((m) => m.resource_type === "video")
      .forEach((media, index) => {
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

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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

  return (
    <>
      {hasFilms ? (
        <div className="grid grid-cols-3 items-center justify-center gap-2  ">
          {user?.media
            ?.filter((m) => m.resource_type === "video")
            .map((m, i) => {
              const isPortrait = videoOrientations[m.url];
              const videoClass = isPortrait !== undefined
                ? isPortrait
                  ? "object-cover"
                  : "object-contain"
                : "object-contain";

              const videoRef = React.createRef();

              const handleMouseEnter = () => {
                videoRef.current?.play();
              };

              const handleMouseLeave = () => {
                videoRef.current?.pause();
                videoRef.current.currentTime = 0; // optional: reset to start
              };

              return (
                <div
                  key={i}
                  className="h-[20rem] w-[12.5rem] group relative cursor-pointer "
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                  <div className="bg-[#181818] h-[20rem] w-[12.5rem] flex items-center justify-center transition-transform duration-200">
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
      ) : (
        <div className="flex flex-col items-center justify-center space-y-5">
          <FilmIcon size={100} color="black" />
          <h1 className="text-2xl font-semibold">No Films Yet</h1>
          <p className="text-neutral-500">When you share films, they will appear on your profile.</p>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-[8px] hover:text-[#474747] transition-all focus:bg-transparent focus:text-black duration-300">Share your first film</Button>
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
              accept="video/*"
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
                {previewUrl && file.type.startsWith('video/') && (
                  <video
                    height={200}
                    width={200}
                    src={previewUrl}
                    className="max-w-xs max-h-48 rounded-md mt-2 object-contain"
                    controls
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

export default Films;



