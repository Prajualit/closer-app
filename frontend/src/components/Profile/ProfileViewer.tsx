"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, MessageCircle, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";

interface MediaItem {
  url?: string;
  resource_type?: string;
  [key: string]: any;
}

interface UserType {
  _id?: string;
  avatarUrl?: string;
  username?: string;
  name?: string;
  bio?: string;
  [key: string]: any;
}

interface ProfileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userProfile?: UserType | null;
}

const ProfileViewer: React.FC<ProfileViewerProps> = ({
  isOpen,
  onClose,
  userId,
  userProfile,
}) => {
  const [profile, setProfile] = useState<UserType | null>(userProfile || null);
  const [loading, setLoading] = useState<boolean>(!userProfile);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [films, setFilms] = useState<MediaItem[]>([]);
  // Top-level refs for all videos
  const videoRefs = React.useRef<
    Array<React.RefObject<HTMLVideoElement | null>>
  >([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>("PHOTOS");
  const [videoOrientations, setVideoOrientations] = useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();
  const currentUser = useSelector(
    (state: { user: { user: UserType } }) => state.user.user
  );

  useEffect(() => {
    if (isOpen && userId && !userProfile) {
      fetchProfile();
    } else if (userProfile) {
      setProfile(userProfile);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, userProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserMedia();
      checkFollowStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Add video orientation detection
  useEffect(() => {
    if (!films?.length) return;
    // Ensure refs array matches films length
    if (videoRefs.current.length !== films.length) {
      videoRefs.current = Array.from({ length: films.length }, () =>
        React.createRef<HTMLVideoElement>()
      );
    }
    films.forEach((film: MediaItem) => {
      const url = film.url || "";
      if (!url) return;
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        const isPortrait = video.videoWidth < video.videoHeight;
        setVideoOrientations((prev) => ({
          ...prev,
          [url]: isPortrait,
        }));
      };
    });
  }, [films]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.USER_PROFILE(userId), {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.data.user);
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMedia = async () => {
    if (!profile || !profile._id) return;
    try {
      const photosResponse = await fetch(
        API_ENDPOINTS.USER_PHOTOS(profile._id),
        {
          credentials: "include",
        }
      );
      const filmsResponse = await fetch(API_ENDPOINTS.USER_FILMS(profile._id), {
        credentials: "include",
      });

      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        setPhotos(
          (photosData.data?.photos || []).map((p: any) => ({
            url: p.url || "",
            ...p,
          }))
        );
      }

      if (filmsResponse.ok) {
        const filmsData = await filmsResponse.json();
        // Ensure all items are objects with url
        setFilms(
          (filmsData.data?.films || []).map((f: any) =>
            typeof f === "object" && f.url ? f : { url: String(f) }
          )
        );
      }
    } catch (error) {
      console.error("Error fetching user media:", error);
    }
  };

  const checkFollowStatus = async () => {
    if (!profile || !profile._id) return;
    try {
      const response = await fetch(API_ENDPOINTS.FOLLOW_STATUS(profile._id), {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setIsFollowing(data.data?.isFollowing || false);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!profile || !profile._id) return;
    try {
      const response = await fetch(
        isFollowing ? API_ENDPOINTS.UNFOLLOW : API_ENDPOINTS.FOLLOW,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ userId: profile._id }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        toast({
          title: "Success",
          description: isFollowing
            ? "Unfollowed successfully"
            : "Following successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update follow status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  // Icon components from profile page
  const GridIcon = ({ size = 18, color = "currentColor" }) => {
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
          d="M18 18V2H2V18H18Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M18 6H22V22H6V18"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M2 11.1185C2.61902 11.0398 3.24484 11.001 3.87171 11.0023C6.52365 10.9533 9.11064 11.6763 11.1711 13.0424C13.082 14.3094 14.4247 16.053 15 18"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12.9998 7H13.0088"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const CameraVideoIcon = ({ size = 20, color = "currentColor" }) => {
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
          d="M4.5 21.5L8.5 17.5M10.5 17.5L14.5 21.5M9.5 17.5L9.5 22.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 17.5V7.5H2V17.5H17Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 10.5002L22 8.00015V17L17 14.5002"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle
          cx="12.5"
          cy="5"
          r="2.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle
          cx="7"
          cy="4.5"
          r="3"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

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

  const navComp = [
    { name: "PHOTOS", icon: <GridIcon /> },
    { name: "FILMS", icon: <CameraVideoIcon /> },
  ];

  const handleMessage = () => {
    // Close the profile viewer and trigger message functionality
    onClose();
    // You can add navigation to chat or trigger message modal here
    toast({
      title: "Chat",
      description: "Opening chat...",
    });
  };

  if (!isOpen) return null;

  // Photos component logic from Photos.jsx
  const hasPhotos = photos.length > 0;

  interface SmartImageProps {
    src: string;
    alt?: string;
    containerClass?: string;
  }
  const SmartImage: React.FC<SmartImageProps> = ({
    src,
    alt = "Image",
    containerClass = "",
  }) => {
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
      const img = new window.Image();
      img.onload = () => {
        setIsPortrait(img.naturalWidth < img.naturalHeight);
      };
      img.src = src;
    }, [src]);

    return (
      <div
        className={`h-[12.5rem] w-[12.5rem] bg-[#181818] dark:bg-black flex items-center justify-center overflow-hidden ${containerClass}`}
      >
        <Image
          src={src}
          alt={alt}
          height={200}
          width={200}
          className={`w-full h-full ${isPortrait ? "object-cover" : "object-contain"}`}
        />
      </div>
    );
  };

  // Films component logic from Films.jsx
  const hasFilms = films.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex">
          {loading ? (
            <div className="flex items-center justify-center w-full h-96">
              <p className="text-neutral-500 dark:text-neutral-400">
                Loading user info...
              </p>
            </div>
          ) : profile ? (
            <div className="flex flex-col items-center justify-center w-full h-full p-20">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 z-50 flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </Button>

              {/* Profile section - exact copy from profile page */}
              <div className="flex items-center justify-center w-full space-x-32">
                {profile?.avatarUrl ? (
                  <div className="w-[250px] h-[250px] rounded-full overflow-hidden relative">
                    <Image
                      height={250}
                      width={250}
                      className="rounded-full object-cover w-full h-full bg-center"
                      src={profile.avatarUrl}
                      alt=""
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col space-y-3 items-start">
                  <div className="flex flex-col items-start justify-center">
                    <h1 className="text-neutral-500">@{profile.username}</h1>
                    <h1 className="text-[32px] text-neutral-900 dark:text-white">
                      {profile.name}
                    </h1>
                    <p className="italic text-neutral-500">{profile.bio}</p>
                  </div>
                  {/* Action Buttons for other users */}
                  {profile._id !== currentUser?._id && (
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleFollow}
                        variant={isFollowing ? "outline" : "default"}
                        className="flex items-center space-x-2"
                      >
                        {isFollowing ? (
                          <UserMinus className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        <span>{isFollowing ? "Unfollow" : "Follow"}</span>
                      </Button>
                      <Button
                        onClick={handleMessage}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-[75%] border mt-20"></div>

              {/* Navigation - exact copy from profile page */}
              <div className="flex justify-center items-center space-x-32 relative w-full mb-20">
                {navComp.map((nav) => (
                  <div
                    key={nav.name}
                    className="flex flex-col text-neutral-500 items-center space-y-5"
                  >
                    <div
                      className={`h-[1px] w-[120%] bg-neutral-500 transition-all duration-300 ${activeNav === nav.name ? "block" : "hidden"}`}
                    ></div>
                    <button
                      className={`transition-all duration-300 text-[14px] flex items-center space-x-2 ${activeNav === nav.name ? "text-black" : "text-neutral-500"}`}
                      onClick={() => setActiveNav(nav.name)}
                    >
                      {nav.icon}
                      <span>{nav.name}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Content sections - exact copy from Photos.jsx and Films.jsx */}
              {activeNav === "PHOTOS" && (
                <>
                  {hasPhotos ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 items-center justify-center gap-1 sm:gap-2">
                      {photos.map((photo, i) => {
                        const url =
                          typeof photo === "object" && photo.url
                            ? photo.url
                            : String(photo);
                        return (
                          <div key={i} className="group relative aspect-square">
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                            <div className="bg-[#181818] dark:bg-black h-full flex items-center justify-center transition-transform duration-200">
                              <SmartImage src={url} alt={`image-${i}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-5">
                      <ProfileShareIcon size={100} color="black" />
                      <h1 className="text-2xl font-semibold">No Photos Yet</h1>
                      <p className="text-neutral-500">
                        When {profile.name} shares photos, they will appear
                        here.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeNav === "FILMS" && (
                <>
                  {hasFilms ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 items-center justify-center gap-1 sm:gap-2">
                      {/* Prepare refs for all videos (React Hook compliant) */}
                      {films.map((film, i) => {
                        const url =
                          typeof film === "object" && film.url
                            ? film.url
                            : String(film);
                        const isPortrait = videoOrientations[url];
                        const videoClass =
                          isPortrait !== undefined
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
                          if (videoRef.current)
                            videoRef.current.currentTime = 0;
                        };

                        return (
                          <div
                            key={i}
                            className="aspect-[3/4] sm:aspect-square group relative cursor-pointer"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                            <div className="bg-[#181818] dark:bg-black h-full w-full flex items-center justify-center transition-transform duration-200">
                              <video
                                ref={videoRef}
                                className={`w-full h-full ${videoClass}`}
                                src={url}
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
                      <p className="text-neutral-500">
                        When {profile.name} shares films, they will appear here.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-96">
              <div className="text-center">
                <div className="text-neutral-500 dark:text-neutral-400 mb-4">
                  Profile not found
                </div>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewer;
