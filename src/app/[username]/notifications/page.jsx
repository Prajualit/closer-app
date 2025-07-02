import React from 'react'
import Navbar from '@/components/HomePg/Navbar'
import NotificationsContainer from '@/components/Notifications/NotificationsContainer'

const page = () => {
    return (
        <div className='h-screen'>
            <Navbar />
            <div className='ml-[15rem] flex flex-col items-center h-full '>
                <div className='w-[50%] h-full border-l border-r py-6 px-10 flex flex-col items-start justify-start space-y-10 '>
                    <div className='w-full'>
                        <NotificationsContainer />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default page
