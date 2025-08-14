"use client";
import React, { useState, useRef, useEffect } from "react";
import { API_ENDPOINTS, makeAuthenticatedRequest } from "@/lib/api";
import { useSocket } from "@/lib/SocketContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share, Send } from "lucide-react";
import NextImage from "next/image";
import DefaultAvatar from "@/components/ui/defaultAvatar";

interface User {
  _id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
}

interface Media {
  _id?: string;
  url?: string;
  caption?: string;
  uploadedAt?: string;
  isLikedByCurrentUser?: boolean;
  likesCount?: number;
  commentsCount?: number;
  userInfo?: User;
  post?: { _id?: string };
  postId?: string;
  user?: User;
  userId?: string;
  media?: { _id?: string; url?: string };
  mediaId?: string;
}

interface Comment {
  _id?: string;
  userId?: User;
  username?: string;
  avatarUrl?: string;
  text?: string;
  createdAt?: string;
}

interface ImageModalProps {
  imageUrl?: Media;
  videoUrl?: Media;
  onClose: () => void;
  user?: User;
}

const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  onClose,
  user,
  videoUrl,
}) => {
  const activeMedia = imageUrl || videoUrl;
  let postId = null;
  let mediaId = null;
  if (user && user._id) {
    postId = user._id;
  } else if (activeMedia?.userInfo?._id) {
    postId = activeMedia.userInfo._id;
  } else if (activeMedia?.post?._id) {
    postId = activeMedia.post._id;
  } else if (activeMedia?.postId) {
    postId = activeMedia.postId;
  } else if (activeMedia?.user?._id) {
    postId = activeMedia.user._id;
  } else if (activeMedia?.userId) {
    postId = activeMedia.userId;
  }
  if (activeMedia?.media?._id) {
    mediaId = activeMedia.media._id;
  } else if (activeMedia?.mediaId) {
    mediaId = activeMedia.mediaId;
  } else if (imageUrl?.mediaId) {
    mediaId = imageUrl.mediaId;
  } else if (videoUrl?.mediaId) {
    mediaId = videoUrl.mediaId;
  } else if (activeMedia?._id && activeMedia?.url) {
    mediaId = activeMedia._id;
  }

  const [isLiked, setIsLiked] = useState(
    typeof activeMedia?.isLikedByCurrentUser === "boolean"
      ? activeMedia.isLikedByCurrentUser
      : false
  );
  const [likesCount, setLikesCount] = useState(
    typeof activeMedia?.likesCount === "number" ? activeMedia.likesCount : 0
  );
  const [commentsCount, setCommentsCount] = useState(
    typeof activeMedia?.commentsCount === "number"
      ? activeMedia.commentsCount
      : 0
  );
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  const videoRef = useRef(null);
  const { socket } = useSocket() as { socket?: any };

  useEffect(() => {
    if (!postId || !mediaId) return;
    setLoadingComments(true);
    makeAuthenticatedRequest(API_ENDPOINTS.GET_COMMENTS(postId, mediaId), {
      method: "GET",
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setComments(
            Array.isArray(data.data?.comments) ? data.data.comments : []
          );
          setCommentsCount(
            typeof data.data?.totalComments === "number"
              ? data.data.totalComments
              : 0
          );
        } else {
          console.warn("Failed to fetch comments:", res.status);
        }
      })
      .catch((err) => {
        console.error("Error fetching comments:", err);
      })
      .finally(() => setLoadingComments(false));

    makeAuthenticatedRequest(API_ENDPOINTS.GET_LIKES_COUNT(postId, mediaId), {
      method: "GET",
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (typeof data.data?.likesCount === "number") {
            setLikesCount(data.data.likesCount);
          }
          if (typeof data.data?.isLikedByCurrentUser === "boolean") {
            setIsLiked(data.data.isLikedByCurrentUser);
          }
        } else {
          console.warn("Failed to fetch likes count:", res.status);
        }
      })
      .catch((err) => {
        console.error("Error fetching likes count:", err);
      });
  }, [postId, mediaId]);

  useEffect(() => {
    if (!socket || !postId || !mediaId) return;
    const handleLikeUpdate = (payload: {
      postId: string;
      mediaId: string;
      likesCount: number;
      isLikedByCurrentUser: boolean;
    }) => {
      if (payload.postId === postId && payload.mediaId === mediaId) {
        setLikesCount(payload.likesCount);
        setIsLiked(payload.isLikedByCurrentUser);
      }
    };
    const handleCommentUpdate = (payload: {
      postId: string;
      mediaId: string;
      commentsCount: number;
      comment: Comment;
    }) => {
      if (payload.postId === postId && payload.mediaId === mediaId) {
        setCommentsCount(payload.commentsCount);
        setComments((prev: Comment[]) => [payload.comment, ...prev]);
      }
    };
    socket.on("like_update", handleLikeUpdate);
    socket.on("comment_update", handleCommentUpdate);
    return () => {
      socket.off("like_update", handleLikeUpdate);
      socket.off("comment_update", handleCommentUpdate);
    };
  }, [socket, postId, mediaId]);

  const handleLike = async (): Promise<void> => {
    if (!postId || !mediaId || loadingLike) return;
    setLoadingLike(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev: number) =>
      newLikedState ? Math.max(0, prev + 1) : Math.max(0, prev - 1)
    );
    try {
      const endpoint = newLikedState
        ? API_ENDPOINTS.LIKE_POST
        : API_ENDPOINTS.UNLIKE_POST;
      const res = await makeAuthenticatedRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ postId, mediaId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikesCount(
          typeof data.data?.likesCount === "number"
            ? data.data.likesCount
            : newLikedState
              ? likesCount + 1
              : Math.max(0, likesCount - 1)
        );
        setIsLiked(
          typeof data.data?.isLikedByCurrentUser === "boolean"
            ? data.data.isLikedByCurrentUser
            : newLikedState
        );
      } else {
        setIsLiked(!newLikedState);
        setLikesCount((prev: number) =>
          newLikedState ? Math.max(0, prev - 1) : prev + 1
        );
      }
    } catch (e) {
      setIsLiked(!newLikedState);
      setLikesCount((prev: number) =>
        newLikedState ? Math.max(0, prev - 1) : prev + 1
      );
      console.error("Like API error:", e);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleAddComment = async (): Promise<void> => {
    if (!newComment.trim() || !postId || !mediaId || loadingComment) return;
    setLoadingComment(true);
    try {
      const res = await makeAuthenticatedRequest(API_ENDPOINTS.ADD_COMMENT, {
        method: "POST",
        body: JSON.stringify({ postId, mediaId, text: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.comment) {
          setComments((prev: Comment[]) => [data.data.comment, ...prev]);
          setCommentsCount(
            typeof data.data?.commentsCount === "number"
              ? data.data.commentsCount
              : commentsCount + 1
          );
          setNewComment("");
        }
      } else {
        console.warn("Failed to add comment:", res.status);
      }
    } catch (e) {
      console.error("Add comment error:", e);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleShare = (): void => {
    if (navigator.share) {
      navigator.share({
        title: `Check out ${user?.name || "this"} media`,
        text: activeMedia?.caption || "Amazing content!",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const getMediaUrl = (media: Media | string | undefined): string => {
    if (!media) return "";
    if (typeof media === "string") return media;
    if (media && typeof (media as Media).url === "string")
      return (media as Media).url ?? "";
    return "";
  };

  return (
    <Dialog open={!!imageUrl || !!videoUrl} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] max-w-7xl h-[90vh] max-h-[90vh] border-none p-0 gap-0 !rounded-lg overflow-hidden bg-transparent outline-none flex flex-col">
        <DialogTitle>
          <span
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            Media Viewer
          </span>
        </DialogTitle>
        <div className="flex flex-col lg:flex-row w-full h-full min-h-0 max-h-[90vh] flex-1">
          <div className="w-full lg:flex-1 h-full min-h-0 bg-black rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none flex items-center justify-center overflow-hidden">
            {videoUrl ? (
              <video
                src={getMediaUrl(videoUrl) || ""}
                controls
                playsInline
                className="object-contain w-full h-full max-h-[calc(90vh-250px)] lg:max-h-[90vh]"
              />
            ) : imageUrl ? (
              <div className="relative w-full h-full min-h-[300px] lg:min-h-full">
                <NextImage
                  src={getMediaUrl(imageUrl) || ""}
                  alt={`Enlarged view`}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <span className="text-white">No media available</span>
            )}
          </div>
          <div className="w-full lg:w-80 xl:w-96 h-full min-h-0 bg-white dark:bg-neutral-900 rounded-b-lg lg:rounded-r-lg max-lg:h-[90%] lg:rounded-bl-none overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex-shrink-0 h-14 flex max-lg:hidden items-center px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
                {user?.avatarUrl ? (
                  <div className="relative w-10 h-10 flex-shrink-0 mr-3">
                    <NextImage
                      src={user?.avatarUrl || "/default-avatar.svg"}
                      fill
                      className="rounded-full object-cover"
                      alt={user?.name || "User"}
                    />
                  </div>
                ) : (
                  <DefaultAvatar />
                )}
                <span className="truncate text-base font-medium text-neutral-900 dark:text-white">
                  {user?.name || user?.username || "Unknown User"}
                </span>
              </div>
              <div className="flex-shrink-0 p-4 pb-2">
                <div className="mb-1 ">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white mr-2">
                    {user?.username || user?.name || "unknown"}
                  </span>
                  <span className="text-neutral-700 text-sm dark:text-neutral-300">
                    {imageUrl?.caption || videoUrl?.caption}
                  </span>
                </div>
                {activeMedia?.uploadedAt && (
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2">
                    {new Date(activeMedia.uploadedAt).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </div>
                )}
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700">
                <div className="px-4 pt-4 pb-2">
                  <h1 className="text-lg font-semibold">Comments</h1>
                </div>
                <div className="px-4 pb-4">
                  {loadingComments ? (
                    <div className="text-center text-neutral-500 py-4">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-neutral-500 py-4">
                      No comments yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment: Comment, idx: number) => {
                        let username = "User";
                        let avatarUrl = "/default-avatar.svg";
                        if (
                          comment.userId &&
                          typeof comment.userId === "object"
                        ) {
                          username = comment.userId.username || "User";
                          avatarUrl =
                            comment.userId.avatarUrl || "/default-avatar.svg";
                        } else if (comment.username) {
                          username = comment.username;
                        }
                        const text = comment.text || "[No text]";
                        let createdAt = "";
                        try {
                          createdAt = comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString()
                            : "";
                        } catch (e) {
                          createdAt = "";
                        }
                        return (
                          <div
                            key={comment._id || idx}
                            className="flex items-start space-x-3"
                          >
                            {avatarUrl ? (
                              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                <NextImage
                                  src={avatarUrl}
                                  width={28}
                                  height={28}
                                  className="rounded-full object-cover"
                                  alt={username}
                                />
                              </div>
                            ) : (
                              <DefaultAvatar />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
                                <div className="font-semibold text-sm text-neutral-900 dark:text-white">
                                  {username}
                                </div>
                                <div className="text-sm text-neutral-700 dark:text-neutral-300 break-words">
                                  {text}
                                </div>
                              </div>
                              {createdAt && (
                                <div className="text-xs text-neutral-500 ml-3 mt-1">
                                  {createdAt}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleLike}
                      disabled={loadingLike}
                      className="flex items-center space-x-2 transition-colors hover:text-red-500 disabled:opacity-50"
                    >
                      <Heart
                        className={`w-6 h-6 ${isLiked ? "text-red-500 fill-red-500" : "text-neutral-600 dark:text-neutral-400"}`}
                      />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {likesCount}
                      </span>
                    </button>
                    <button
                      className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      disabled
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {commentsCount}
                      </span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      <Share className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-0">
                <div className="flex items-center space-x-3">
                  {user?.avatarUrl ? (
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <NextImage
                        src={user?.avatarUrl || "/default-avatar.svg"}
                        fill
                        className="rounded-full object-cover"
                        alt="Your avatar"
                      />
                    </div>
                  ) : (
                    <DefaultAvatar />
                  )}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 pr-12 text-sm border-none outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-white placeholder-neutral-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment();
                        }
                      }}
                      disabled={loadingComment}
                    />
                    {newComment.trim() && !loadingComment && (
                      <button
                        onClick={handleAddComment}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {loadingComment && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
