'use client'
import React, { useState, useEffect } from 'react'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'

const UserActivity = () => {
    interface ActivityData {
        postsCount: number;
        followersCount: number;
        followingCount: number;
    }
    const [activityData, setActivityData] = useState<ActivityData>({
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
                if (
                    error &&
                    typeof error === 'object' &&
                    'name' in error &&
                    typeof (error as any).name === 'string' &&
                    (error as any).name !== 'AbortError'
                ) {
                    console.error('Error fetching user activity:', error)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchUserActivity()
    }, [])

    if (loading) {
        return (
            <div className='bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700'>
                <h3 className='text-lg font-semibold text-neutral-900 dark:text-white mb-4'>Your Activity</h3>
                <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className='flex justify-between items-center animate-pulse'>
                            <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-20'></div>
                            <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-8'></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className='bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700'>
            <h3 className='text-lg font-semibold text-neutral-900 dark:text-white mb-4'>Your Activity</h3>
            <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                    <span className='text-neutral-600 dark:text-neutral-400 text-sm'>Posts shared</span>
                    <span className='font-semibold text-neutral-500 dark:text-neutral-300'>{activityData.postsCount}</span>
                </div>
                <div className='flex justify-between items-center'>
                    <span className='text-neutral-600 dark:text-neutral-400 text-sm'>Followers</span>
                    <span className='font-semibold text-neutral-500 dark:text-neutral-300'>{activityData.followersCount}</span>
                </div>
                <div className='flex justify-between items-center'>
                    <span className='text-neutral-600 dark:text-neutral-400 text-sm'>Following</span>
                    <span className='font-semibold text-neutral-500 dark:text-neutral-300'>{activityData.followingCount}</span>
                </div>
            </div>
        </div>
    )
}

export default UserActivity
