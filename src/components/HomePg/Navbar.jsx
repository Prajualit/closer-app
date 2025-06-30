"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import logo from "@/assets/logo.png"
import Navsearch from '@/components/HomePg/Navsearch'
import UserButton from '@/components/HomePg/UserButton'
import { useSelector, useDispatch } from "react-redux";
import { setActiveNav } from '@/redux/slice/navbarSlice'
import CreateModal from '../Modal/create.modal'

const Navbar = () => {
    const userDetails = useSelector((state) => state.user.user);
    const activeNav = useSelector((state) => state.navbar.activeNav);
    const dispatch = useDispatch();

    const HomeIcon = ({ size = 24, color = "currentColor" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                role="img"
            >
                <path
                    d="M21 8L12 2L3 8V22H9V15H15V22H21V8Z"
                    stroke={color}
                    strokeWidth="1.5"
                />
            </svg>
        );
    };

    const CameraVideoIcon = ({ size = 24, color = "currentColor" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                role="img"
            >
                <path
                    d="M4.5 21.5L8.5 17.5M10.5 17.5L14.5 21.5M9.5 17.5L9.5 22.5"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path
                    d="M17 17.5V7.5H2V17.5H17Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path
                    d="M17 10.5002L22 8.00015V17L17 14.5002"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <circle
                    cx="12.5"
                    cy="5"
                    r="2.5"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <circle
                    cx="7"
                    cy="4.5"
                    r="3"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const ChatIcon = ({ size = 24, color = "currentColor" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                role="img"
            >
                <path
                    d="M8.98368 18.8571C8.4529 18.7286 7.92497 18.5621 7.37131 18.3685L3.79112 19.9492C3.78341 19.9526 3.7752 19.9456 3.77743 19.9375L4.69206 16.617C3.4357 15.3458 2.00622 13.8115 2.00622 10.3996C1.82328 5.4028 7.24655 1.74833 11.1012 2.01194C11.9954 2.01212 12.9963 2.25396 13.8395 2.45769L13.8735 2.4659C15.1064 2.8253 17.1562 3.99932 18.3692 5.68609C19.3875 7.10215 19.7414 8.54366 19.8281 9.0031"
                    stroke={color}
                    strokeWidth="1.5"
                />
                <path
                    d="M21.5829 18.1218C22.9036 15.2439 20.8918 12.0011 18.1313 11.2209C15.5118 10.3423 12.1405 11.8827 11.2565 14.5002C10.3724 17.1177 11.7078 20.3463 14.8531 21.162C16.4741 21.7057 17.7451 21.3273 18.1736 21.1618C18.8539 21.3753 20.3554 21.6858 20.8648 21.9977C20.9744 22.0647 20.7937 21.2466 20.6428 19.5171C20.9028 19.0977 21.4739 18.6989 21.5829 18.1218Z"
                    stroke={color}
                    strokeWidth="1.5"
                />
            </svg>
        );
    };

    const NotificationIcon = ({ size = 24, color = "currentColor" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                role="img"
            >
                <path
                    d="M21 17.5H3C4.50991 16.896 5.5 15.4336 5.5 13.8074V9C5.5 5.41015 8.41015 2.5 12 2.5C15.5899 2.5 18.5 5.41015 18.5 9V13.8074C18.5 15.4336 19.4901 16.896 21 17.5Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M14.5 20.5C13.8557 21.1186 12.9733 21.5 12 21.5C11.0267 21.5 10.1443 21.1186 9.5 20.5"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const AddSquareIcon = ({ size = 24, color = "currentColor" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                role="img"
            >
                <path
                    d="M12 8V16M16 12H8"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M2.5 19.5C2.5 20.6046 3.39543 21.5 4.5 21.5H19.5C20.6046 21.5 21.5 20.6046 21.5 19.5V4.5C21.5 3.39543 20.6046 2.5 19.5 2.5H4.5C3.39543 2.5 2.5 3.39543 2.5 4.5V19.5Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const UserCircleIcon = ({ size = 24, color = "currentColor" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                role="img"
            >
                <path
                    d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="square"
                />
                <path
                    d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="square"
                />
                <path
                    d="M17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="square"
                />
            </svg>
        );
    };

    const navComp = [
        { name: "Home", icon: <HomeIcon /> },
        { name: "Films", icon: <CameraVideoIcon /> },
        { name: "Chat", icon: <ChatIcon /> },
        { name: "Notifications", icon: <NotificationIcon /> },
        { name: "Create", icon: <AddSquareIcon /> },
        { name: "Profile", icon: <UserCircleIcon /> },
    ];

    return (
        <div className='h-screen fixed bg-neutral-50 border-r flex flex-col justify-center items-start px-5 py-10 w-[15rem] space-y-14 z-50 '>
            <Link href='/'>
                <Image className='w-[100px] ml-[16.67%] ' src={logo} alt="" />
            </Link>
            <div className='flex flex-col items-start justify-start h-full space-y-5 w-full '>
                {navComp.map((nav) => {
                    return (
                        nav.name === "Create" ? <CreateModal key={nav.name} nav={nav} activeNav={activeNav} /> : (
                            <Link className='w-full' key={nav.name} href={`/${userDetails.username}/${nav.name.toLowerCase()}`}>
                                <button onClick={() => dispatch(setActiveNav(nav.name.toLowerCase()))} className={`transition-all duration-300 flex items-center space-x-2 rounded-[8px] px-5 py-3 hover:bg-[#efefef] focus:bg-neutral-100 focus:text-black w-full ${activeNav === nav.name.toLowerCase() ? "text-black" : "text-neutral-500"}`}>
                                    {nav.icon}
                                    <span>{nav.name}</span>
                                </button>
                            </Link>
                        )
                    )
                })}
            </div>
            <div className='absolute bottom-10 w-[83.33%] '>
                <UserButton />
            </div>
        </div>
    )
}

export default Navbar
