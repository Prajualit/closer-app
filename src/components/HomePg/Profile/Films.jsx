'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import Image from "next/image";
import { useState, useEffect } from 'react'

const Films = () => {

      const userDetails = useSelector((state) => state.user.user);
      const [hasFilms, setHasFilms] = useState(false);
    
      // if (userDetails.films.length > 0) {
      //   setHasFilms(true);
      // }

      const FilmIcon = ({ size = 24, color = "#000000" }) => {
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
              d="M2 7H22"
              stroke={color}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            <path
              d="M2 17H22"
              stroke={color}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            <path
              d="M12 17L12 7"
              stroke={color}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            <path
              d="M21.5 21.5V2.5H2.5V21.5H21.5Z"
              stroke={color}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            <path
              d="M8 7L8 3M16 7L16 3"
              stroke={color}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            <path
              d="M8 21L8 17M16 21L16 17"
              stroke={color}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      };
    
  return (
    hasFilms ? (
        <div>
  
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center space-y-5'>
          <FilmIcon size={100} color="black" />
          <h1 className='text-2xl font-semibold'>No Films Yet</h1>
          <p className='text-neutral-500'>When you share films, they will appear on your profile.</p>
          <button className=" rounded-[8px] hover:text-[#474747] transition-all focus:bg-transparent focus:text-black duration-300 ">Share your first film</button>
        </div>
      )
  )
}

export default Films
