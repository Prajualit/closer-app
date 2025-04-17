import React from 'react'
import Navbar from '@/components/HomePg/Navbar.jsx'
import Navsearch from '@/components/HomePg/Navsearch.jsx'
import { useSelector } from 'react-redux'
import Photo from '@/components/ui/photo.jsx'

const page = () => {
    return (
        <div className='flex'>
            <Navbar />
            <div className='ml-[15rem] flex items-center justify-center w-full p-10 space-x-10 overflow-y-auto '>
                <div className='w-full h-full flex flex-col items-center justify-start rounded-xl '>
                    <div className='w-full flex items-center justify-center pb-5 '>
                        <Navsearch />
                    </div>
                    <Photo />
                    <Photo />
                    <Photo />
                </div>
                <div className='w-[50%] flex items-center justify-center bg-[#efefef] rounded-xl'>

                </div>
            </div>
        </div>
    )
}

export default page
