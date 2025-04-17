import React from 'react'
import search from "@/assets/search.png"
import logo from "@/assets/logo.png"
import Image from 'next/image'

const Navsearch = () => {

    return (
        <div className='border border-[#cacaca] w-[75%] transition-all duration-300 hover:shadow-md focus-within:shadow-md flex items-center rounded-full px-3 py-2 bg-[#f7f7f7] space-x-2 '>
            <Image src={search} alt="" />
            <input
                placeholder='Search'
                className='bg-transparent outline-none w-full ' type="text" />
        </div>
    )
}

export default Navsearch
