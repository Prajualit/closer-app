'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '@/redux/slice/userSlice';
import Navbar from '@/components/HomePg/Navbar';
import LoadingButton from '@/components/LoadingButton';

const ProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId;
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [films, setFilms] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeNav, setActiveNav] = useState("PHOTOS");
    const [videoOrientations, setVideoOrientations] = useState({});
    const { toast } = useToast();
    const currentUser = useSelector((state) => state.user.user);
    const dispatch = useDispatch();

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    useEffect(() => {
        if (profile) {
            fetchUserMedia();
            checkFollowStatus();
        }
    }, [profile]);

    // Add video orientation detection
    useEffect(() => {
        if (!films?.length) return;

        films.forEach((film) => {
            const video = document.createElement("video");
            video.src = film.url || film;
            video.onloadedmetadata = () => {
                const isPortrait = video.videoWidth < video.videoHeight;
                setVideoOrientations((prev) => ({
                    ...prev,
                    [film.url || film]: isPortrait,
                }));
            };
        });
    }, [films]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/v1/users/profile/${userId}`, {
                credentials: 'include',
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    toast({
                        title: 'Profile Not Found',
                        description: 'The user profile you are looking for does not exist.',
                        variant: 'destructive',
                    });
                    return;
                } else if (response.status === 400) {
                    toast({
                        title: 'Invalid User ID',
                        description: 'The user ID format is invalid.',
                        variant: 'destructive',
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
                    title: 'Error',
                    description: data.message || 'Failed to load profile',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast({
                title: 'Error',
                description: 'Failed to connect to server. Please check your connection.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUserMedia = async () => {
        try {
            const [photosResponse, filmsResponse] = await Promise.all([
                fetch(`http://localhost:5000/api/v1/users/photos/${profile._id}`, {
                    credentials: 'include',
                }),
                fetch(`http://localhost:5000/api/v1/users/films/${profile._id}`, {
                    credentials: 'include',
                })
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
            console.error('Error fetching user media:', error);
        }
    };

    const checkFollowStatus = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/users/follow-status/${profile._id}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setIsFollowing(data.data?.isFollowing || false);
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const handleFollow = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/users/${isFollowing ? 'unfollow' : 'follow'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ userId: profile._id }),
            });

            const data = await response.json();

            if (data.success) {
                // Update follow status
                setIsFollowing(!isFollowing);
                
                // Update follower count immediately
                setProfile(prevProfile => ({
                    ...prevProfile,
                    followersCount: isFollowing 
                        ? (prevProfile.followersCount || 1) - 1 
                        : (prevProfile.followersCount || 0) + 1
                }));
                
                // Update current user's following count in Redux
                dispatch(updateUser({
                    followingCount: isFollowing 
                        ? (currentUser.followingCount || 1) - 1 
                        : (currentUser.followingCount || 0) + 1
                }));
                
                toast({
                    title: 'Success',
                    description: isFollowing ? 'Unfollowed successfully' : 'Following successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update follow status',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update follow status',
                variant: 'destructive',
            });
        }
    };

    const handleMessage = () => {
        // Navigate to chat with this user using query parameters
        router.push(`/${currentUser.username}/chat?userId=${profile._id}&username=${profile.username}`);
    };

    const handleBack = () => {
        router.back();
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

    const navComp = [
        { name: "PHOTOS", icon: <GridIcon /> },
        { name: "FILMS", icon: <CameraVideoIcon /> },
    ];

    if (loading) {
        return (
            <div className="flex">
                <div className="flex flex-col items-center justify-center w-full h-screen">
                    <p className="text-gray-500">Loading user info...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex">
                <div className="flex flex-col items-center justify-center w-full h-screen">
                    <div className="text-center">
                        <div className="text-gray-500 mb-4">Profile not found</div>
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

    const SmartImage = ({ src, alt = "Image", containerClass = "" }) => {
        const [isPortrait, setIsPortrait] = useState(false);

        useEffect(() => {
            const img = new window.Image();
            img.onload = () => {
                setIsPortrait(img.naturalWidth < img.naturalHeight);
            };
            img.src = src;
        }, [src]);

        return (
            <div className={`h-[12.5rem] w-[12.5rem] bg-[#181818] flex items-center justify-center overflow-hidden ${containerClass}`}>
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
        <div className="flex">
            <Navbar />
            {/* Header with back button */}
            <div className="fixed top-0 left-0 right-0 ml-[15rem] bg-white border-b z-10">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-20">
                            <Button
                                onClick={handleBack}
                                className="flex items-center group justify-center border rounded-[5px] px-5 !w-fit hover:bg-neutral-100 transition-all duration-300"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-all duration-300 " />
                                <span>Back</span>
                            </Button>
                            <h1 className="text-xl font-semibold">{profile.name}</h1>
                        </div>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content - exact copy from original profile page */}
            <div className="flex flex-col items-center justify-center w-full h-full p-20 pt-32">
                {/* Profile section - Userdata component style */}
                <div className="flex items-center justify-center w-full space-x-32">
                    <div className='w-[250px] h-[250px] rounded-full overflow-hidden relative'>
                        <Image 
                            height={250} 
                            width={250} 
                            className="rounded-full object-cover w-full h-full bg-center" 
                            src={profile.avatarUrl} 
                            alt="" 
                        />
                    </div>
                    <div className="flex flex-col space-y-3 items-start">
                        <div className="flex flex-col items-start justify-center">
                            <h1 className="text-neutral-500">@{profile.username}</h1>
                            <h1 className="text-[32px]">{profile.name}</h1>
                            <p className="italic text-neutral-500">{profile.bio}</p>
                        </div>
                        {/* Action Buttons for other users */}
                        {profile._id !== currentUser?._id && (
                            <div className="flex space-x-3 mb-6">
                                <LoadingButton
                                    onClick={handleFollow}
                                    variant={isFollowing ? "outline" : "default"}
                                    className="flex items-center space-x-2"
                                >
                                    {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                                </LoadingButton>
                                <Button
                                    onClick={handleMessage}
                                    className="flex items-center group justify-center border rounded-[5px] px-5 !w-fit hover:bg-neutral-100 transition-all duration-300" 
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Message</span>
                                </Button>
                            </div>
                        )}
                        
                        {/* Stats */}
                        <div className="flex space-x-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{photos.length}</div>
                                <div className="text-gray-500">Photos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{films.length}</div>
                                <div className="text-gray-500">Films</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{profile.followersCount || 0}</div>
                                <div className="text-gray-500">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{profile.followingCount || 0}</div>
                                <div className="text-gray-500">Following</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-[75%] border mt-20"></div>

                {/* Navigation - exact copy from original profile page */}
                <div className="flex justify-center items-center space-x-32 relative w-full mb-20">
                    {navComp.map((nav) => (
                        <div key={nav.name} className="flex flex-col text-neutral-500 items-center space-y-5">
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
                            <div className="grid grid-cols-3 items-center justify-center gap-2">
                                {photos.map((photo, i) => (
                                    <div
                                        key={i}
                                        className='group relative h-[12.5rem] w-[12.5rem]'
                                    >
                                        <div className='absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer'></div>
                                        <div className='bg-[#181818] h-full flex items-center justify-center transition-transform duration-200'>
                                            <SmartImage src={photo.url || photo} alt={`image-${i}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-5">
                                <ProfileShareIcon size={100} color="black" />
                                <h1 className="text-2xl font-semibold">No Photos Yet</h1>
                                <p className="text-neutral-500">
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
                                    const isPortrait = videoOrientations[film.url || film];
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
                                        videoRef.current.currentTime = 0;
                                    };

                                    return (
                                        <div
                                            key={i}
                                            className="h-[20rem] w-[12.5rem] group relative cursor-pointer"
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 group-focus-within:opacity-10 cursor-pointer"></div>
                                            <div className="bg-[#181818] h-[20rem] w-[12.5rem] flex items-center justify-center transition-transform duration-200">
                                                <video
                                                    ref={videoRef}
                                                    className={`w-full h-full ${videoClass}`}
                                                    src={film.url || film}
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
                                <p className="text-neutral-500">When {profile.name} shares films, they will appear here.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
