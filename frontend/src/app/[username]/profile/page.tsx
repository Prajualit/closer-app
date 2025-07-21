"use client";
import { useEffect, useState, FC } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/HomePg/Navbar";
import Userdata from "@/components/Profile/Userdata";
import { useSelector } from "react-redux";
import type { RootState } from '@/redux/Store';
import Image from "next/image";
import Posts from "@/components/Profile/Photos";
import Films from "@/components/Profile/Films";


const Page = () => {
    const params = useParams();
    const userDetails = useSelector((state: RootState) => state.user.user);
    const [activeNav, setActiveNav] = useState<'PHOTOS' | 'FILMS'>("PHOTOS");

    const GridIcon: FC<{ size?: number; color?: string }> = ({ size = 18, color = "currentColor" }) => {
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
                    d="M18 18V2H2V18H18Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path
                    d="M18 6H22V22H6V18"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path
                    d="M2 11.1185C2.61902 11.0398 3.24484 11.001 3.87171 11.0023C6.52365 10.9533 9.11064 11.6763 11.1711 13.0424C13.082 14.3094 14.4247 16.053 15 18"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path
                    d="M12.9998 7H13.0088"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="square"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const CameraVideoIcon: FC<{ size?: number; color?: string }> = ({ size = 20, color = "currentColor" }) => {
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

    const navComp = [
        { name: "PHOTOS", icon: <GridIcon /> },
        { name: "FILMS", icon: <CameraVideoIcon /> },
    ] as const;

    return (
        <div className="flex bg-white dark:bg-neutral-900 min-h-screen">
            <Navbar />
            {userDetails ? (
                <>
                    {/* Desktop Layout */}
                    <div className="hidden lg:flex lg:ml-[15rem] flex-col items-center justify-center w-full h-full p-6 lg:p-20">
                        <Userdata />
                        <div className="w-[75%] border border-neutral-200 dark:border-neutral-700 mt-20"></div>
                        <div className="flex justify-center items-center space-x-32 relative w-full mb-20">
                            {navComp.map((nav) => (
                                <div key={nav.name} className="flex flex-col text-neutral-500 dark:text-neutral-400 items-center space-y-5">
                                    <div
                                        className={`h-[1px] w-[120%] bg-neutral-500 dark:bg-neutral-400 transition-all duration-300 ${activeNav === nav.name ? "block" : "hidden"}`}
                                    ></div>
                                    <button
                                        className={`transition-all duration-300 text-[14px] flex items-center space-x-2 ${activeNav === nav.name ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}
                                        onClick={() => setActiveNav(nav.name as 'PHOTOS' | 'FILMS')}
                                    >
                                        {nav.icon}
                                        <span>{nav.name}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        {activeNav === "PHOTOS" && <Posts />}
                        {activeNav === "FILMS" && <Films />}
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden w-full pt-16 pb-20">
                        <div className="px-4 py-6">
                            {/* Mobile User Data */}
                            <div className="mb-8">
                                <Userdata />
                            </div>
                            
                            {/* Mobile Navigation Tabs */}
                            <div className="sticky top-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 mb-6 pb-3 z-30">
                                <div className="flex justify-center space-x-8">
                                    {navComp.map((nav) => (
                                        <button
                                            key={nav.name}
                                            className={`flex flex-col items-center space-y-2 py-2 px-4 transition-all duration-300 ${
                                                activeNav === nav.name 
                                                    ? "text-black dark:text-white border-b-2 border-black dark:border-white" 
                                                    : "text-neutral-500 dark:text-neutral-400"
                                            }`}
                                            onClick={() => setActiveNav(nav.name as 'PHOTOS' | 'FILMS')}
                                        >
                                            {nav.icon}
                                            <span className="text-sm font-medium">{nav.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Content */}
                            <div className="min-h-[60vh]">
                                {activeNav === "PHOTOS" && <Posts />}
                                {activeNav === "FILMS" && <Films />}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center w-full h-screen ml-[15rem]">
                    <p className="text-neutral-500 dark:text-neutral-400">Loading user info...</p>
                </div>
            )}
        </div>
    );
};

export default Page;
