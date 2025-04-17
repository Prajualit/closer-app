"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/HomePg/Navbar.jsx";
import Userdata from "@/components/HomePg/Userdata";
import { useSelector } from "react-redux";
import Image from "next/image";

const Page = ({ params }) => {
    const userDetails = useSelector((state) => state.user.user);

    return (
        <div>
            <Navbar />
            {userDetails ? (
                <div className="flex flex-col items-center justify-center h-full p-20 space-y-20 ">
                    <Userdata />
                    <div className="w-[75%] border "></div>
                </div>
            ) : (
                <p>Loading user info...</p>
            )}
        </div>
    );
};

export default Page;
