"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import logo from "@/assets/logo.png"
import Navsearch from '@/components/HomePg/Navsearch'
import UserButton from '@/components/HomePg/UserButton'


const Navbar = () => {
    const [userData, setUserData] = useState("")

    const loadUserData = async () => {
        try {
            const user = await fetch('http://localhost:5000/api/getuser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            })
            const data = await user.json()
            setUserData(data)
        } catch (err) {
            console.log("Error in fetching: ", err)
        }
    }

    useEffect(() => {
        loadUserData()
    }
        , [])


    return (
        <div className='h-[70px] bg-neutral-100 shadow-md flex justify-between items-center px-10 '>
            <Link href='/'>
                <Image className='w-[100px] ' src={logo} alt="" />
            </Link>
            <Navsearch />
            <UserButton userData={userData} />
        </div>
    )
}

export default Navbar
