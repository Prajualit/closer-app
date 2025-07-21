import React from 'react'
import Navbar from '@/components/HomePg/Navbar'
import Navsearch from '@/components/HomePg/Navsearch'
import PostsFeed from '@/components/HomePg/PostsFeed'
import SuggestedUsers from '@/components/HomePg/SuggestedUsers'
import UserActivity from '@/components/HomePg/UserActivity'
import BackToTop from '@/components/ui/BackToTop'

const Page: React.FC = () => {
    return (
        <div className='flex min-h-screen bg-neutral-50 dark:bg-neutral-900'>
            <Navbar />
            {/* Desktop Layout */}
            <div className='hidden lg:block lg:ml-[15rem] w-full'>
                <div className='w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 p-6'>
                    {/* Main Feed */}
                    <div className='flex-1 flex flex-col items-center space-y-6 max-w-lg mx-auto lg:mx-0'>
                        <Navsearch />
                        <PostsFeed />
                    </div>

                    {/* Sidebar - Sticky Position */}
                    <div className='w-full lg:w-80 xl:w-96 pt-16'>
                        <div className='sticky top-3 space-y-6'>
                            <SuggestedUsers />
                            <UserActivity />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className='lg:hidden w-full pt-16 pb-20'>
                <div className='flex flex-col space-y-4 px-4'>
                    {/* Mobile Search - Non-sticky */}

                    <Navsearch />


                    {/* Mobile Posts Feed with Suggested Users after refresh button */}
                    <div className='space-y-4'>
                        <PostsFeed suggestedUsersComponent={
                            <div className='bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700'>
                                <SuggestedUsers />
                            </div>
                        } />
                    </div>
                </div>
            </div>
            <BackToTop />
        </div>
    )
}

export default Page
