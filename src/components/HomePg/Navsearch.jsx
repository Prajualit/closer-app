import React from 'react'
import search from "@/assets/search.png"
import logo from "@/assets/logo.png"
import Image from 'next/image'

const Navsearch = () => {

    return (
        <div className='border transition-all duration-300 hover:shadow-md focus-within:shadow-md flex items-center rounded-full px-3 py-2 bg-[#e8e8e8] space-x-2 w-[30%] '>
            <Image src={search} alt="" />
            <input
                placeholder='Search'
                className='bg-transparent outline-none w-full ' type="text" />
        </div>
    )
}

export default Navsearch
