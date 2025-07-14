'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'
import { useSelector } from 'react-redux'
import LoadingButton from '../LoadingButton'
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
                const response = await makeAuthenticatedRequest(
                    API_ENDPOINTS.SUGGESTED_USERS,
                    { method: 'GET' }
                )

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.data.users) {
                        setSuggestedUsers(data.data.users)
                    }
                }
            } catch (error) {
                console.error('Error fetching suggested users:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSuggestedUsers()
    }, [])

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
                // Remove the followed user from suggestions
                setSuggestedUsers(prev => prev.filter(user => user._id !== userId))
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
                {suggestedUsers.length === 0 ? (
                    <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No suggestions available.</p>
                    </div>
                ) : (
                    suggestedUsers.slice(0, 3).map((user) => (
                        <div key={user._id} className="flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-700 py-2 px-3 rounded-[8px] transition-all duration-300 cursor-pointer ">
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
                                className="px-5 text-xs font-medium !w-fit !h-fit transition-colors"
                            >
                                Follow
                            </LoadingButton>
                        </div>
                    )))}
                {suggestedUsers.length > 3 && (
                    < div className="text-center mt-4">
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
