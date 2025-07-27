// --- Types for user profile and media ---
interface UserProfile {
  _id: string;
  username: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
}

interface MediaItem {
  _id?: string;
  mediaId?: string;
  id?: string;
  url: string;
  caption?: string;
  uploadedAt?: string;
}
("use client");

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserMinus,
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "@/redux/slice/userSlice";
import Navbar from "@/components/HomePg/Navbar";
import LoadingButton from "@/components/LoadingButton";
import ImageModal from "@/components/Modal/viewMedia.modal";
import { API_ENDPOINTS } from "@/lib/api";

const ProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [films, setFilms] = useState<MediaItem[]>([]);
  // Store likes/comments for each media by id
  const [mediaStats, setMediaStats] = useState<
    Record<string, { likesCount: number; commentsCount: number }>
  >({});
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<"PHOTOS" | "FILMS">("PHOTOS");
  const [videoOrientations, setVideoOrientations] = useState<
    Record<string, boolean>
  >({});
  const [selectedMedia, setSelectedMedia] = useState<{
    imageUrl?: MediaItem;
    videoUrl?: MediaItem;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const currentUser = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  const handleBack = () => {
    router.back();
  };

  // Add video orientation detection
  useEffect(() => {
    if (!films?.length) return;

    films.forEach((film) => {
      const video = document.createElement("video");
      video.src = film.url;
      video.onloadedmetadata = () => {
        const isPortrait = video.videoWidth < video.videoHeight;
        setVideoOrientations((prev) => ({
          ...prev,
          [film.url]: isPortrait,
        }));
      };
    });
  }, [films]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.USER_PROFILE(userId), {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Profile Not Found",
            description: "The user profile you are looking for does not exist.",
            variant: "destructive",
          });
          return;
        } else if (response.status === 400) {
          toast({
            title: "Invalid User ID",
            description: "The user ID format is invalid.",
            variant: "destructive",
          });
          return;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        setProfile(data.data.user);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description:
          "Failed to connect to server. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const fetchUserMedia = useCallback(async () => {
    try {
      if (!profile) return;
      const [photosResponse, filmsResponse] = await Promise.all([
        fetch(API_ENDPOINTS.USER_PHOTOS(profile._id), {
          credentials: "include",
        }),
        fetch(API_ENDPOINTS.USER_FILMS(profile._id), {
          credentials: "include",
        }),
      ]);

      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        setPhotos(photosData.data?.photos || []);
      }

      if (filmsResponse.ok) {
        const filmsData = await filmsResponse.json();
        setFilms(filmsData.data?.films || []);
      }
    } catch (error) {
      console.error("Error fetching user media:", error);
    }
  }, [profile]);

  const checkFollowStatus = useCallback(async () => {
    try {
      if (!profile) return;
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
  }, [profile]);

  // useEffect to fetch profile when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  // useEffect to fetch user media and follow status when profile changes
  useEffect(() => {
    if (profile) {
      fetchUserMedia();
      checkFollowStatus();
    }
  }, [profile, fetchUserMedia, checkFollowStatus]);

  const handleFollow = async () => {
    try {
      if (!profile) return;
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
        // Update follow status
        setIsFollowing(!isFollowing);

        // Update follower count immediately
        setProfile((prevProfile) => {
          if (!prevProfile) return prevProfile;
          return {
            ...prevProfile,
            followersCount: isFollowing
              ? (prevProfile.followersCount || 1) - 1
              : (prevProfile.followersCount || 0) + 1,
          };
        });

        // Update current user's following count in Redux
        dispatch(
          updateUser({
            followingCount: isFollowing
              ? (currentUser.followingCount || 1) - 1
              : (currentUser.followingCount || 0) + 1,
          })
        );

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

  const handleMessage = () => {
    // Navigate to chat with this user using query parameters
    if (!profile) return;
    router.push(
      `/${currentUser.username}/chat?userId=${profile._id}&username=${profile.username}`
    );
  };

  const handleImageClick = (media: MediaItem, isVideo = false) => {
    if (!profile) return;
    // Attach postId and mediaId for modal to use
    let modalMedia = {
      ...media,
      postId: profile._id,
      mediaId: media._id || media.mediaId || media.id || media.url,
    };
    if (isVideo) {
      setSelectedMedia({ videoUrl: modalMedia });
    } else {
      setSelectedMedia({ imageUrl: modalMedia });
    }
    setSelectedUser(profile);
  };

  // Fetch likes/comments for all media (photos and films)
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      const allMedia = [
        ...photos.map((photo) => ({
          type: "photo",
          _id: photo._id || photo.mediaId || photo.id || photo.url,
          postId: profile._id,
          mediaId: photo._id || photo.mediaId || photo.id || photo.url,
        })),
        ...films.map((film) => ({
          type: "film",
          _id: film._id || film.mediaId || film.id || film.url,
          postId: profile._id,
          mediaId: film._id || film.mediaId || film.id || film.url,
        })),
      ];
      const stats: Record<
        string,
        { likesCount: number; commentsCount: number }
      > = {};
      await Promise.all(
        allMedia.map(async (media) => {
          try {
            // Likes
            const likesRes = await fetch(
              API_ENDPOINTS.GET_LIKES_COUNT(media.postId, media.mediaId),
              { credentials: "include" }
            );
            const likesData = likesRes.ok ? await likesRes.json() : {};
            // Comments
            const commentsRes = await fetch(
              API_ENDPOINTS.GET_COMMENTS(media.postId, media.mediaId),
              { credentials: "include" }
            );
            const commentsData = commentsRes.ok ? await commentsRes.json() : {};
            stats[String(media._id)] = {
              likesCount: likesData?.data?.likesCount ?? 0,
              commentsCount: commentsData?.data?.totalComments ?? 0,
            };
          } catch (e) {
            stats[String(media._id)] = { likesCount: 0, commentsCount: 0 };
          }
        })
      );
      setMediaStats(stats);
    };
    if (profile && (photos.length > 0 || films.length > 0)) {
      fetchStats();
    }
  }, [profile, photos, films]);

  const handleCloseModal = () => {
    setSelectedMedia(null);
    setSelectedUser(null);
  };

  // Icon components from original profile page
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

  const navComp: { name: "PHOTOS" | "FILMS"; icon: React.ReactElement }[] = [
    { name: "PHOTOS", icon: <GridIcon /> },
    { name: "FILMS", icon: <CameraVideoIcon /> },
  ];

  if (loading) {
    return (
      <div className="flex">
        <div className="flex flex-col items-center justify-center w-full h-screen">
          <p className="text-neutral-500">Loading user info...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex">
        <div className="flex flex-col items-center justify-center w-full h-screen">
          <div className="text-center">
            <div className="text-neutral-500 mb-4">Profile not found</div>
            <Button onClick={handleBack} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Photos component logic
  const hasPhotos = photos.length > 0;

  const SmartImage = ({
    src,
    alt = "Image",
    containerClass = "",
  }: {
    src: string;
    alt?: string;
    containerClass?: string;
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

  // Films component logic
  const hasFilms = films.length > 0;

  return (
    <div className="flex bg-neutral-100 dark:bg-neutral-900 min-h-screen">
      <Navbar />
      {/* Header with back button */}
      <div className="fixed top-0 left-0 right-0 lg:ml-[15rem] bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 lg:space-x-20">
              <Button
                onClick={handleBack}
                className="flex items-center group justify-center border border-neutral-200 dark:border-neutral-700 rounded-[5px] px-3 lg:px-5 !w-fit hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-all duration-300" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className="text-lg lg:text-xl font-semibold text-neutral-900 dark:text-white">
                {profile.name}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="hidden lg:flex lg:ml-[15rem] flex-col items-center justify-center w-full h-full p-20 pt-32">
        {/* Profile section - Userdata component style */}
        <div className="flex items-center justify-center w-full space-x-32">
          {profile.avatarUrl ? (
            <div className="w-[250px] h-[250px] rounded-full overflow-hidden relative">
              <Image
                height={250}
                width={250}
                className="rounded-full object-cover w-full h-full bg-center"
                src={profile.avatarUrl || "/default-avatar.svg"}
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
              <div className="flex space-x-3 mb-6">
                <LoadingButton
                  onClick={handleFollow}
                  pending={false}
                  className="flex items-center space-x-2 dark:!bg-neutral-800 dark:!text-white dark:hover:!bg-neutral-700 transition-all "
                >
                  {isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isFollowing ? "Unfollow" : "Follow"}</span>
                </LoadingButton>
                <Button
                  onClick={handleMessage}
                  className="flex items-center group justify-center border border-neutral-200 dark:border-neutral-700 rounded-[5px] px-5 !w-fit hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {photos.length}
                </div>
                <div className="text-neutral-500">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {films.length}
                </div>
                <div className="text-neutral-500">Films</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {profile.followersCount || 0}
                </div>
                <div className="text-neutral-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {profile.followingCount || 0}
                </div>
                <div className="text-neutral-500">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[75%] border border-neutral-200 dark:border-neutral-700 mt-20"></div>

        {/* Navigation - exact copy from original profile page */}
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
                className={`transition-all duration-300 text-[14px] flex items-center space-x-2 ${activeNav === nav.name ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}
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
              <div className="grid grid-cols-3 items-center justify-center gap-2">
                {photos.map((photo, i) => {
                  return (
                    <div
                      key={i}
                      className="group relative h-[12.5rem] w-[12.5rem] cursor-pointer"
                      onClick={() =>
                        handleImageClick(
                          {
                            ...photo,
                            url: photo.url,
                            caption: photo.caption,
                            uploadedAt: photo.uploadedAt,
                            _id:
                              photo._id ||
                              photo.mediaId ||
                              photo.id ||
                              photo.url,
                          },
                          false
                        )
                      }
                    >
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                      <div className="bg-[#181818] dark:bg-black h-full flex items-center justify-center transition-transform duration-200">
                        <SmartImage src={photo.url} alt={`image-${i}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-5">
                <ProfileShareIcon size={100} color="currentColor" />
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  No Photos Yet
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  When {profile.name} shares photos, they will appear here.
                </p>
              </div>
            )}
          </>
        )}

        {activeNav === "FILMS" && (
          <>
            {hasFilms ? (
              <div className="grid grid-cols-3 items-center justify-center gap-2">
                {films.map((film, i) => {
                  const id = film._id || film.mediaId || film.id || film.url;
                  const stats = mediaStats[id] || {
                    likesCount: 0,
                    commentsCount: 0,
                  };
                  const isPortrait = videoOrientations[film.url];
                  const videoClass =
                    isPortrait !== undefined
                      ? isPortrait
                        ? "object-cover"
                        : "object-contain"
                      : "object-contain";
                  const videoRef = React.createRef<HTMLVideoElement>();
                  const handleMouseEnter = () => {
                    videoRef.current?.play();
                  };
                  const handleMouseLeave = () => {
                    if (videoRef.current) {
                      videoRef.current.pause();
                      videoRef.current.currentTime = 0;
                    }
                  };
                  return (
                    <div
                      key={i}
                      className="h-[20rem] w-[12.5rem] group relative cursor-pointer"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onClick={() =>
                        handleImageClick(
                          {
                            ...film,
                            url: film.url,
                            caption: film.caption,
                            uploadedAt: film.uploadedAt,
                            _id:
                              film._id || film.mediaId || film.id || film.url,
                          },
                          true
                        )
                      }
                    >
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                      <div className="bg-[#181818] h-[20rem] w-[12.5rem] flex items-center justify-center transition-transform duration-200">
                        <video
                          ref={videoRef}
                          className={`w-full h-full ${videoClass}`}
                          src={film.url}
                          muted
                          loop
                          playsInline
                        />
                      </div>
                      {/* Overlay for likes/comments */}
                      <div className="absolute bottom-2 left-2 flex space-x-3 bg-black/60 rounded px-2 py-1 text-white text-xs">
                        <span>❤️ {stats.likesCount}</span>
                        <span>💬 {stats.commentsCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-5">
                <FilmIcon size={100} color="currentColor" />
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  No Films Yet
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  When {profile.name} shares films, they will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full pt-16 pb-20">
        <div className="px-4 py-6">
          {/* Mobile Profile Header */}
          <div className="flex flex-col items-center space-y-6 mb-8">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <Image
                  src={profile.avatarUrl || "/default-avatar.svg"}
                  alt={profile.name}
                  fill
                  className="rounded-full object-cover"
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

            {/* User Info */}
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                {profile.name}
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 max-w-xs mx-auto">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {profile._id !== currentUser._id && (
              <div className="flex space-x-3">
                <LoadingButton
                  onClick={handleFollow}
                  pending={false}
                  className="flex items-center space-x-2 dark:!bg-neutral-800 dark:!text-white dark:hover:!bg-neutral-700 transition-all text-sm px-4 py-2"
                >
                  {isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isFollowing ? "Unfollow" : "Follow"}</span>
                </LoadingButton>
                <Button
                  onClick={handleMessage}
                  className="flex items-center space-x-2 text-sm px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-[5px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="flex space-x-6 sm:space-x-8">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {photos.length}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500">
                  Photos
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {films.length}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500">Films</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {profile.followersCount || 0}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500">
                  Followers
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {profile.followingCount || 0}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500">
                  Following
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="sticky top-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 mb-6 pb-3 z-30">
            <div className="flex justify-center space-x-8">
              {navComp.map((nav) => (
                <button
                  key={nav.name}
                  className={`flex flex-col items-center space-y-2 py-2 px-4 transition-all duration-300 ${
                    activeNav === nav.name
                      ? "text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                  onClick={() => setActiveNav(nav.name)}
                >
                  {nav.icon}
                  <span className="text-sm font-medium">{nav.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Content Grid */}
          <div className="min-h-[60vh]">
            {activeNav === "PHOTOS" && (
              <>
                {hasPhotos ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square"
                        onClick={() =>
                          handleImageClick(
                            {
                              ...photo,
                              url: photo.url,
                              caption: photo.caption,
                              uploadedAt: photo.uploadedAt,
                              _id:
                                photo._id ||
                                photo.mediaId ||
                                photo.id ||
                                photo.url,
                            },
                            false
                          )
                        }
                      >
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                        <div className="bg-[#181818] dark:bg-black h-full flex items-center justify-center transition-transform duration-200">
                          <Image
                            src={photo.url}
                            alt="User photo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-5 py-20">
                    <GridIcon size={80} color="currentColor" />
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                      No Photos Yet
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-center">
                      When {profile.name} shares photos, they will appear here.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeNav === "FILMS" && (
              <>
                {hasFilms ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                    {films.map((film, i) => {
                      const isPortrait = videoOrientations[film.url];
                      const videoClass =
                        isPortrait !== undefined
                          ? isPortrait
                            ? "object-cover"
                            : "object-contain"
                          : "object-contain";

                      const videoRef = React.createRef<HTMLVideoElement>();

                      const handleMouseEnter = () => {
                        videoRef.current?.play();
                      };

                      const handleMouseLeave = () => {
                        if (videoRef.current) {
                          videoRef.current.pause();
                          videoRef.current.currentTime = 0;
                        }
                      };

                      return (
                        <div
                          key={i}
                          className="aspect-[3/4] group relative cursor-pointer"
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                          onClick={() =>
                            handleImageClick(
                              {
                                ...film,
                                url: film.url,
                                caption: film.caption,
                                uploadedAt: film.uploadedAt,
                                _id:
                                  film._id ||
                                  film.mediaId ||
                                  film.id ||
                                  film.url,
                              },
                              true
                            )
                          }
                        >
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                          <div className="bg-[#181818] h-full w-full flex items-center justify-center transition-transform duration-200">
                            <video
                              ref={videoRef}
                              className={`w-full h-full ${videoClass}`}
                              src={film.url}
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
                  <div className="flex flex-col items-center justify-center space-y-5 py-20">
                    <FilmIcon size={80} color="currentColor" />
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                      No Films Yet
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-center">
                      When {profile.name} shares films, they will appear here.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image/Video Modal */}
      {selectedMedia && (
        <ImageModal
          imageUrl={selectedMedia.imageUrl}
          videoUrl={selectedMedia.videoUrl}
          onClose={handleCloseModal}
          user={
            selectedUser
              ? {
                  _id: selectedUser._id,
                  name: selectedUser.name,
                  username: selectedUser.username,
                  avatarUrl: selectedUser.avatarUrl,
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

export default ProfilePage;
