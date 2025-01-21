"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import logo from "@/assets/logo.png"
import Navsearch from '@/components/HomePg/Navsearch'
import UserButton from '@/components/HomePg/UserButton'


const Navbar = () => {



    return (
        <div className='h-[70px] bg-neutral-100 shadow-md flex justify-between items-center px-10 '>
            <Link href='/'>
                <Image className='w-[100px] ' src={logo} alt="" />
            </Link>
            <Navsearch />
            <UserButton />
        </div>
    )
}

export default Navbar
