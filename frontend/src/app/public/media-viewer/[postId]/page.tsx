"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Media from "@/components/MediaViewer/Media";
import Navbar from "@/components/HomePg/Navbar";

interface MediaType {
  _id?: string | number;
  url?: string;
  caption?: string;
  uploadedAt?: string;
}

interface CommentType {
  _id?: string | number;
  userId?: { username?: string };
  user?: { username?: string };
  text?: string;
}

interface PostType {
  _id?: string | number;
  username?: string;
  avatarUrl?: string;
  isLikedByCurrentUser?: boolean;
  likesCount?: number;
  commentsCount?: number;
  comments?: CommentType[];
  media: MediaType;
  title?: string;
  content?: string;
}

const PublicMediaViewerPage = () => {
  return (
    <div className="h-screen bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-4 flex items-center">
      <Navbar />
      <div className="ml-[15rem] h-full w-full flex items-center justify-center">
        <Media />
      </div>
    </div>
  );
};

export default PublicMediaViewerPage;
