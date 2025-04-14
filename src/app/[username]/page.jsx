"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/HomePg/Navbar.jsx";

const Page = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/v1/users/getUser", {
                method: "GET",
                credentials: "include",
            });

            const response = await res.json();

            if (res.ok) {
                console.log("User Info:", response.data);
                setUser(response.data);
            } else {
                console.error("Error:", response.message);
            }
        } catch (err) {
            console.error("Fetch failed:", err);
        }
    };

    const { username } = router.query.user?.username;

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    return (
        <div>
            <Navbar />
            {user ? (
                <div>
                    <h2>Welcome, {username}</h2>
                </div>
            ) : (
                <p>Loading user info...</p>
            )}
        </div>
    );
};

export default Page;
