import React from 'react'
import Navbar from '@/components/HomePg/Navbar'
import NotificationsContainer from '@/components/Notifications/NotificationsContainer'

const page = () => {
    return (
        <div className='min-h-screen bg-white dark:bg-neutral-900'>
            <Navbar />
            <div className='ml-[15rem] flex flex-col items-center h-full '>
                <div className='w-[50%] h-full border-l border-r border-neutral-200 dark:border-neutral-700 py-6 px-10 flex flex-col items-start justify-start space-y-10 bg-white dark:bg-neutral-900'>
                    <div className='w-full'>
                        <NotificationsContainer />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default page
