'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import Image from "next/image";
import { useState, useEffect } from 'react'

const Photos = () => {

  const userDetails = useSelector((state) => state.user.user);
  const [hasPhotos, setHasPhotos] = useState(false);

  // if (userDetails.posts.length > 0) {
  //   setHasPosts(true);
  // }

  const ProfileShareIcon = ({ size = 62, color = "currentColor" }) => {
    return (
      <svg
        aria-label="When you share photos, they will appear on your profile."
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 96 96"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>When you share photos, they will appear on your profile.</title>
        <circle
          cx="48"
          cy="48"
          r="47"
          fill="none"
          stroke={color}
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        <ellipse
          cx="48.002"
          cy="49.524"
          rx="10.444"
          ry="10.476"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="2.095"
        />
        <path
          d="M63.994 69A8.02 8.02 0 0 0 72 60.968V39.456a8.023 8.023 0 0 0-8.01-8.035h-1.749a4.953 4.953 0 0 1-4.591-3.242C56.61 25.696 54.859 25 52.469 25h-8.983c-2.39 0-4.141.695-5.181 3.178a4.954 4.954 0 0 1-4.592 3.242H32.01a8.024 8.024 0 0 0-8.012 8.035v21.512A8.02 8.02 0 0 0 32.007 69Z"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    hasPhotos ? (
      <div>

      </div>
    ) : (
      <div className='flex flex-col items-center justify-center space-y-5'>
        <ProfileShareIcon size={100} color="black" />
        <h1 className='text-2xl font-semibold'>No Photos Yet</h1>
        <p className='text-neutral-500'>When you share photos, they will appear on your profile.</p>
        <button className=" rounded-[8px] hover:text-[#474747] transition-all focus:bg-transparent focus:text-black duration-300 ">Share your first photo</button>
      </div>
    )
  )
}

export default Photos
