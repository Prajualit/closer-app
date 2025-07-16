'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'
import { useSelector } from 'react-redux'
import LoadingButton from '@/components/LoadingButton'
import SuggestedUsersModal from '../Modal/suggestedUsers.modal'

const SuggestedUsers = () => {
    const [suggestedUsers, setSuggestedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const currentUser = useSelector((state) => state.user.user)
    const router = useRouter()

    useEffect(() => {
        const fetchSuggestedUsers = async () => {
            try {
                // Fetch more users for the modal (increased limit)
                const response = await makeAuthenticatedRequest(
                    `${API_ENDPOINTS.SUGGESTED_USERS}?limit=20`,
                    { method: 'GET' }
                )

                if (response.ok) {
                    const data = await response.json()
                    console.log('Suggested users response:', data) // Debug log
                    if (data.success && data.data.users) {
                        console.log('Setting suggested users:', data.data.users) // Debug log
                        setSuggestedUsers(data.data.users)
                    } else {
                        console.log('No users in response or unsuccessful:', data)
                    }
                } else {
                    console.error('API response not ok:', response.status, response.statusText)
                }
            } catch (error) {
                console.error('Error fetching suggested users:', error)
            } finally {
                setLoading(false)
            }
        }

        if (currentUser && currentUser !== "home") {
            fetchSuggestedUsers()
        } else {
            setLoading(false)
        }
    }, [currentUser])

    const handleFollow = async (userId) => {
        try {
            const response = await makeAuthenticatedRequest(
                API_ENDPOINTS.FOLLOW,
                {
                    method: 'POST',
                    body: JSON.stringify({ userId })
                }
            )

            if (response.ok) {
                console.log('Successfully followed user:', userId) // Debug log
                // Update the user's following status instead of removing them
                setSuggestedUsers(prev => prev.map(user => 
                    user._id === userId 
                        ? { ...user, isFollowed: true }
                        : user
                ))
            } else {
                console.error('Failed to follow user:', response.status)
            }
        } catch (error) {
            console.error('Error following user:', error)
        }
    }

    const handleProfileClick = (userId) => {
        router.push(`/profile/${userId}`)
    }

    return (
        <div className="w-full bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Suggested for you</h3>
            </div>

            <div className="">
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading suggestions...</p>
                    </div>
                ) : suggestedUsers.length === 0 ? (
                    <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No suggestions available.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View - Vertical List */}
                        <div className="hidden lg:block space-y-2">
                            {suggestedUsers.slice(0, 3).filter(user => !user.isFollowed).map((user) => (
                                <div key={user._id} className="flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-700 py-2 px-3 rounded-[8px] transition-all duration-300 cursor-pointer">
                                    <div
                                        className="flex items-center space-x-3 flex-1 cursor-pointer rounded-lg p-2 transition-colors"
                                        onClick={() => handleProfileClick(user._id)}
                                    >
                                        <div className="relative w-10 h-10">
                                            <Image
                                                src={user.avatarUrl || '/default-avatar.svg'}
                                                alt={user.name}
                                                fill
                                                className="rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                                {user.username}
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {user.followersCount || 0} followers
                                            </p>
                                        </div>
                                    </div>
                                    <LoadingButton
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleFollow(user._id)
                                        }}
                                        className="px-3 py-1 text-xs font-medium !w-fit !h-fit transition-colors"
                                        disabled={user.isFollowed}
                                    >
                                        {user.isFollowed ? 'Followed' : 'Follow'}
                                    </LoadingButton>
                                </div>
                            ))}
                        </div>

                        {/* Mobile View - Horizontal Scroll */}
                        <div className="lg:hidden">
                            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                                {suggestedUsers.filter(user => !user.isFollowed).map((user) => (
                                    <div key={user._id} className="flex-shrink-0 w-20 sm:w-24">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div
                                                className="relative w-16 h-16 sm:w-20 sm:h-20 cursor-pointer"
                                                onClick={() => handleProfileClick(user._id)}
                                            >
                                                <Image
                                                    src={user.avatarUrl || '/default-avatar.svg'}
                                                    alt={user.name}
                                                    fill
                                                    className="rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="text-xs font-medium text-neutral-900 dark:text-white truncate w-full">
                                                    {user.username}
                                                </h4>
                                                <LoadingButton
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleFollow(user._id)
                                                    }}
                                                    className="mt-1 px-2 py-1 text-xs font-medium !w-full !h-fit transition-colors"
                                                    disabled={user.isFollowed}
                                                >
                                                    {user.isFollowed ? 'Followed' : 'Follow'}
                                                </LoadingButton>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {/* Show More Button - Only on Desktop */}
                {suggestedUsers.filter(user => !user.isFollowed).length > 3 && (
                    <div className="hidden lg:block text-center mt-4">
                        <LoadingButton
                            onClick={() => setIsModalOpen(true)}
                            className="!bg-white dark:!bg-neutral-700 hover:!bg-neutral-50 dark:hover:!bg-neutral-600 !text-black dark:!text-white"
                        >
                            Show More
                        </LoadingButton>
                    </div>
                )}
            </div>

            <SuggestedUsersModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                suggestedUsers={suggestedUsers}
                onFollow={handleFollow}
            />
        </div>
    )
}

export default SuggestedUsers
