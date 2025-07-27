"use client";
import React from "react";
import { useSelector } from "react-redux";
import Image from "next/image";

interface UserType {
  avatarUrl?: string;
  username?: string;
  bio?: string;
  [key: string]: any;
}

interface FavouriteIconProps {
  size?: number;
  color?: string;
}

const FavouriteIcon: React.FC<FavouriteIconProps> = ({
  size = 24,
  color = "#000000",
}) => {
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
        d="M2 9.24835C2 5.90905 4.16367 2.99998 7.68 2.99998C9.64299 2.99998 11 3.99861 12 5.49861C13 3.99861 14.357 2.99998 16.32 2.99998C19.8363 2.99998 22 5.90905 22 9.24835C22 15.0599 16.6416 18.6767 12 20.9986C7.35839 18.6767 2 15.0599 2 9.24835Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Photo: React.FC = () => {
  const userDetails: UserType = useSelector(
    (state: { user: { user: UserType } }) => state.user.user
  );

  return (
    <div className="w-[60%] ">
      <div className="p-3 flex items-center justify-start space-x-2  ">
        {userDetails?.avatarUrl ? (
          <Image
            width={32}
            height={32}
            className="rounded-full"
            src={userDetails.avatarUrl}
            alt=""
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
        <h1 className="font-semibold">{userDetails?.username || ""}</h1>
      </div>
      {userDetails?.avatarUrl ? (
        <Image
          width={100}
          height={100}
          className="w-full bg-cover bg-center "
          src={userDetails.avatarUrl}
          alt=""
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-full">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-neutral-400 dark:text-neutral-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      )}
      <div className=" p-3 flex-col flex items-start justify-center  ">
        <div className=" flex items-center justify-start space-x-1 ">
          <button>
            <FavouriteIcon />
          </button>
          <span className="text-[14px] ">1M Likes</span>
        </div>
        <div className="flex space-x-2">
          <span className="font-semibold">{userDetails?.username || ""}</span>
          <p>{userDetails?.bio || ""}</p>
        </div>
      </div>
    </div>
  );
};

export default Photo;
