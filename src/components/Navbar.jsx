"use client"

import React from 'react'
import Image from 'next/image'
import search from "@/assets/search.png"
import logo from "@/assets/logo.png"

const Navbar = () => {

    const UserCircleIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            role="img"
            color="#000000"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM11.9916 6.25C10.1958 6.25 8.73808 7.70407 8.73808 9.5C8.73808 11.2959 10.1958 12.75 11.9916 12.75C13.7875 12.75 15.2452 11.2959 15.2452 9.5C15.2452 7.70407 13.7875 6.25 11.9916 6.25ZM17.0409 16.4802C14.3735 13.6002 9.57472 13.7487 6.96382 16.4756L6.77631 16.6631C6.63104 16.8084 6.55172 17.0069 6.55688 17.2123C6.56204 17.4177 6.65122 17.612 6.8036 17.7498C8.17769 18.9923 10.0013 19.75 12.0001 19.75C13.9989 19.75 15.8225 18.9923 17.1966 17.7498C17.349 17.612 17.4382 17.4177 17.4433 17.2123C17.4485 17.0069 17.3692 16.8084 17.2239 16.6631L17.0409 16.4802Z"
                fill="#000000"
            />
        </svg>
    );

    return (
        <div className='h-[70px] bg-neutral-100 shadow-md flex justify-between items-center px-10 '>
            <Image className='w-[100px] ' src={logo} alt="" />
            <div className='border transition-all duration-300 hover:shadow-md focus-within:shadow-md flex items-center rounded-full px-3 py-2 bg-[#e8e8e8] space-x-2 w-[30%] '>
                <Image src={search} alt="" />
                <input 
                placeholder='Search'
                className='bg-transparent outline-none w-full ' type="text" />
            </div>
            <button className='hover:bg-neutral-200 transition-colors duration-300 rounded-full p-2'>
                {UserCircleIcon()}
            </button>
        </div>
    )
}

export default Navbar
