'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import Image from 'next/image'

const Stories = () => {
    const userDetails = useSelector((state: { user: { user: any } }) => state.user.user)
    
    // Mock stories data - in a real app, this would come from an API
    interface Story {
        id: number;
        username: string;
        avatar: string;
        isOwnStory?: boolean;
        hasStory: boolean;
    }
    const stories: Story[] = [
        {
            id: 1,
            username: 'Your story',
            avatar: userDetails?.avatarUrl || '/default-avatar.svg',
            isOwnStory: true,
            hasStory: false
        },
        {
            id: 2,
            username: 'alex_photo',
            avatar: '/default-avatar.svg',
            hasStory: true
        },
        {
            id: 3,
            username: 'sarah_travels',
            avatar: '/default-avatar.svg',
            hasStory: true
        },
        {
            id: 4,
            username: 'mike_chef',
            avatar: '/default-avatar.svg',
            hasStory: true
        },
        {
            id: 5,
            username: 'emma_art',
            avatar: '/default-avatar.svg',
            hasStory: true
        }
    ]

    const AddIcon = () => (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
    )

    return (
        <div className="w-full bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700 mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Stories</h3>
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
                {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center space-y-1 min-w-[60px]">
                        <div className={`relative ${story.hasStory && !story.isOwnStory ? 'p-0.5 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 rounded-full' : ''}`}>
                            <div className="relative w-12 h-12 bg-white dark:bg-neutral-700 rounded-full p-0.5">
                                <Image
                                    src={story.avatar}
                                    alt={story.username}
                                    fill
                                    className="rounded-full object-cover"
                                />
                                {story.isOwnStory && !story.hasStory && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-700">
                                        <AddIcon />
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 text-center max-w-[60px] truncate">
                            {story.isOwnStory ? 'Your story' : story.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Stories
