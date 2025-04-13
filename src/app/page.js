"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/HomePg/Navbar";
import axios from "axios";

export default function Home() {
  const [userData, setUserData] = useState("");

  const loadUserData = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/users/getUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const responseData = await response.json();
      setUserData(responseData);
      console.log("User Data: ", responseData);
    } catch (err) {
      console.log("Error in fetching: ", err);
    } finally {
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <>
      <Navbar />
    </>
  );
}
