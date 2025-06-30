'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';

const ProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId;
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [films, setFilms] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const { toast } = useToast();
    const currentUser = useSelector((state) => state.user.user);

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
                setIsFollowing(!isFollowing);
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
        // Navigate to chat with this user
        router.push(`/${currentUser.username}/chat?user=${profile.username}`);
    };

    const handleBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-500 mb-4">Profile not found</div>
                    <Button onClick={handleBack} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="flex items-center space-x-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
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

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <div className="w-[200px] h-[200px] rounded-full overflow-hidden relative">
                            <Image
                                height={200}
                                width={200}
                                className="rounded-full object-cover w-full h-full bg-center"
                                src={profile.avatarUrl}
                                alt={profile.name}
                            />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                            <div className="mb-6">
                                <h1 className="text-neutral-500 text-lg">@{profile.username}</h1>
                                <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                                <p className="text-neutral-600 italic">{profile.bio}</p>
                            </div>
                            
                            {/* Action Buttons */}
                            {profile._id !== currentUser?._id && (
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <Button
                                        onClick={handleFollow}
                                        variant={isFollowing ? "outline" : "default"}
                                        className="flex items-center space-x-2"
                                    >
                                        {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                        <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
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

                            {/* Stats */}
                            <div className="flex justify-center md:justify-start space-x-8">
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
                </div>

                {/* Content Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                    <Tabs defaultValue="photos" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-50 m-4">
                            <TabsTrigger value="photos">Photos</TabsTrigger>
                            <TabsTrigger value="films">Films</TabsTrigger>
                        </TabsList>

                        <TabsContent value="photos" className="p-6">
                            {photos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <Image
                                                src={photo.url || photo}
                                                alt={`Photo ${index + 1}`}
                                                width={300}
                                                height={300}
                                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-200 cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-16">
                                    <div className="text-lg mb-2">No photos uploaded yet</div>
                                    <div className="text-sm">When {profile.name} shares photos, they'll appear here.</div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="films" className="p-6">
                            {films.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {films.map((film, index) => (
                                        <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            <video
                                                src={film.url || film}
                                                className="object-cover w-full h-full"
                                                controls
                                                preload="metadata"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-16">
                                    <div className="text-lg mb-2">No films uploaded yet</div>
                                    <div className="text-sm">When {profile.name} shares films, they'll appear here.</div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
