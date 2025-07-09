'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'
import { useSelector } from 'react-redux'

const SuggestedUsers = () => {
    const [suggestedUsers, setSuggestedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const currentUser = useSelector((state) => state.user.user)

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

    return (
        <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Suggested for you</h3>
                <button className="text-xs font-medium text-blue-500 hover:text-blue-600">
                    See All
                </button>
            </div>
            
            <div className="space-y-3">
                {suggestedUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10">
                                <Image
                                    src={user.avatarUrl || '/default-avatar.svg'}
                                    alt={user.name}
                                    fill
                                    className="rounded-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {user.username}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {user.mutualFollowers} mutual followers
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleFollow(user._id)}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Follow
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 space-y-1">
                    <p>© 2024 Closer from NITH</p>
                    <div className="flex flex-wrap gap-2">
                        <a href="#" className="hover:underline">About</a>
                        <a href="#" className="hover:underline">Help</a>
                        <a href="#" className="hover:underline">Privacy</a>
                        <a href="#" className="hover:underline">Terms</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SuggestedUsers
