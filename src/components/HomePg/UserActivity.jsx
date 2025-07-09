'use client'
import React, { useState, useEffect } from 'react'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'

const UserActivity = () => {
    const [activityData, setActivityData] = useState({
        postsCount: 0,
        followersCount: 0,
        followingCount: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserActivity = async () => {
            try {
                const response = await makeAuthenticatedRequest(
                    API_ENDPOINTS.USER_ACTIVITY,
                    { method: 'GET' }
                )
                
                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setActivityData(data.data)
                    }
                }
            } catch (error) {
                console.error('Error fetching user activity:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserActivity()
    }, [])

    if (loading) {
        return (
            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Your Activity</h3>
                <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className='flex justify-between items-center animate-pulse'>
                            <div className='h-4 bg-gray-200 rounded w-20'></div>
                            <div className='h-4 bg-gray-200 rounded w-8'></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Your Activity</h3>
            <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                    <span className='text-gray-600 text-sm'>Posts shared</span>
                    <span className='font-semibold text-blue-500'>{activityData.postsCount}</span>
                </div>
                <div className='flex justify-between items-center'>
                    <span className='text-gray-600 text-sm'>Followers</span>
                    <span className='font-semibold text-green-500'>{activityData.followersCount}</span>
                </div>
                <div className='flex justify-between items-center'>
                    <span className='text-gray-600 text-sm'>Following</span>
                    <span className='font-semibold text-purple-500'>{activityData.followingCount}</span>
                </div>
            </div>
        </div>
    )
}

export default UserActivity
