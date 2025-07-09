import React from 'react'
import Navbar from '@/components/HomePg/Navbar.jsx'
import Navsearch from '@/components/HomePg/Navsearch.jsx'
import PostsFeed from '@/components/HomePg/PostsFeed.jsx'
import SuggestedUsers from '@/components/HomePg/SuggestedUsers.jsx'
import UserActivity from '@/components/HomePg/UserActivity.jsx'
import FloatingActionButton from '@/components/ui/FloatingActionButton.jsx'
import BackToTop from '@/components/ui/BackToTop.jsx'

const page = () => {
    return (
        <div className='flex min-h-screen bg-gray-50'>
            <Navbar />
            <div className='ml-[15rem] flex items-start justify-center w-full p-6 overflow-y-auto'>
                <div className='w-full max-w-6xl flex flex-col lg:flex-row gap-8'>
                    {/* Main Feed */}
                    <div className='flex-1 flex flex-col items-center max-w-lg mx-auto lg:mx-0'>
                        <div className='w-full mb-6'>
                            <Navsearch />
                        </div>
                        <PostsFeed />
                    </div>
                    
                    {/* Sidebar */}
                    <div className='w-full lg:w-80 xl:w-96'>
                        <div className='sticky top-6 space-y-6'>
                            <SuggestedUsers />
                            <UserActivity />

                            {/* Trending Hashtags */}
                            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Trending</h3>
                                <div className='space-y-2'>
                                    {['#photography', '#travel', '#food', '#art', '#nature'].map((tag, index) => (
                                        <div key={tag} className='flex items-center justify-between'>
                                            <span className='text-blue-500 text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors'>
                                                {tag}
                                            </span>
                                            <span className='text-xs text-gray-400'>
                                                {Math.floor(Math.random() * 100) + 10}K posts
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FloatingActionButton />
            <BackToTop />
        </div>
    )
}

export default page
