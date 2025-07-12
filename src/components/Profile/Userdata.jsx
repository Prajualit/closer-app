import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Image from "next/image";
import EditProfile from "@/components/Modal/editProfile.modal";
import { updateUser } from '@/redux/slice/userSlice';

const Userdata = () => {
    const userDetails = useSelector((state) => state.user.user);
    const dispatch = useDispatch();
    const [stats, setStats] = useState({
        followersCount: userDetails?.followersCount || 0,
        followingCount: userDetails?.followingCount || 0
    });

    // Calculate photos and films count from user media
    const photosCount = userDetails?.media?.filter(item => item.resource_type === "image").length || 0;
    const filmsCount = userDetails?.media?.filter(item => item.resource_type === "video").length || 0;

    // Fetch current user's follower stats if not available
    useEffect(() => {
        const fetchUserStats = async () => {
            if (!userDetails?._id) return;

            // Only fetch if we don't have the counts
            if (userDetails.followersCount === undefined || userDetails.followingCount === undefined) {
                try {
                    const response = await fetch(`http://localhost:5000/api/v1/users/profile/${userDetails._id}`, {
                        credentials: 'include',
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            const newStats = {
                                followersCount: data.data.user.followersCount || 0,
                                followingCount: data.data.user.followingCount || 0
                            };

                            setStats(newStats);

                            // Update Redux with the fetched counts
                            dispatch(updateUser(newStats));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user stats:', error);
                }
            } else {
                // Use existing counts from Redux
                setStats({
                    followersCount: userDetails.followersCount,
                    followingCount: userDetails.followingCount
                });
            }
        };

        fetchUserStats();
    }, [userDetails?._id, userDetails?.followersCount, userDetails?.followingCount, dispatch]);

    return (
        <div>
            <div className="flex items-center justify-center w-full space-x-32 ">
                <div className='w-[250px] h-[250px] rounded-full overflow-hidden relative'>
                    <Image height={250} width={250} className="rounded-full object-cover w-full h-full bg-center " src={userDetails.avatarUrl} alt="" />
                </div>
                <div className="flex flex-col space-y-3 items-start ">
                    <div className="flex flex-col items-start justify-center">
                        <h1 className="text-neutral-500 dark:text-neutral-400">@{userDetails.username}</h1>
                        <h1 className="text-[32px] text-neutral-900 dark:text-white">{userDetails.name}</h1>
                        <p className="italic text-neutral-500 dark:text-neutral-400">{userDetails.bio}</p>
                    </div>
                    <EditProfile />

                    {/* Stats */}
                    <div className="flex space-x-8 mt-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{photosCount}</div>
                            <div className="text-neutral-500 dark:text-neutral-400">Photos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{filmsCount}</div>
                            <div className="text-neutral-500 dark:text-neutral-400">Films</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.followersCount}</div>
                            <div className="text-neutral-500 dark:text-neutral-400">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.followingCount}</div>
                            <div className="text-neutral-500 dark:text-neutral-400">Following</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Userdata
