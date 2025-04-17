"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/HomePg/Navbar.jsx";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/redux/user/userSlice.js";

const Page = ({ params }) => {
    const userDetails = useSelector((state) => state.user.user);

    return (
        <div>
            <Navbar />
            {userDetails ? (
                <div>
                    <h2>Welcome, {userDetails.name}</h2>
                </div>
            ) : (
                <p>Loading user info...</p>
            )}
        </div>
    );
};

export default Page;
