import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API_ENDPOINTS, makeAuthenticatedRequest } from "@/lib/api";
import { Heart, MessageCircle, Share, Send } from "lucide-react";
import Image from "next/image";
import DefaultAvatar from "@/components/ui/defaultAvatar";

interface MediaType {
  resource_type: string;
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
  createdAt?: string;
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

const Media: React.FC = () => {
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(
    post?.isLikedByCurrentUser || false
  );
  const [likesCount, setLikesCount] = useState<number>(post?.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState<number>(
    post?.commentsCount || 0
  );
  const [comments, setComments] = useState<CommentType[]>(post?.comments || []);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const match = pathname?.match(/([\w-]+)$/);
    const postId = match ? match[1] : null;
    if (!postId) {
      setError("Invalid post URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    makeAuthenticatedRequest(`${API_ENDPOINTS.POSTS}`, {
      method: "GET",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success && data.data.posts) {
          let found = data.data.posts.find(
            (p: any) => p._id?.toString() === postId
          );
          if (!found) {
            found = data.data.posts.find(
              (p: any) => p.media && p.media._id?.toString() === postId
            );
          }
          if (found) {
            setPost(found);
            setIsLiked(found.isLikedByCurrentUser || false);
            setLikesCount(found.likesCount || 0);
            setCommentsCount(found.commentsCount || 0);
            setComments(found.comments || []);
          } else {
            throw new Error("Post not found");
          }
        } else {
          throw new Error(data.message || "Post not found");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    try {
      const endpoint = newLikedState
        ? API_ENDPOINTS.LIKE_POST
        : API_ENDPOINTS.UNLIKE_POST;
      const response = await makeAuthenticatedRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          postId: post?._id ?? "",
          mediaId: post?.media?._id ? post?.media._id!.toString() : "",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLikesCount(data.data.likesCount);
        }
      } else {
        // Revert on error
        setIsLiked(!newLikedState);
        setLikesCount((prev) => (newLikedState ? prev - 1 : prev + 1));
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount((prev) => (newLikedState ? prev - 1 : prev + 1));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || loadingComment) return;

    setLoadingComment(true);
    try {
      const response = await makeAuthenticatedRequest(
        API_ENDPOINTS.ADD_COMMENT,
        {
          method: "POST",
          body: JSON.stringify({
            postId: post?._id ?? "",
            mediaId: post?.media?._id ? post?.media._id!.toString() : "",
            text: newComment.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments((prev) => [data.data.comment, ...prev]);
          setCommentsCount(data.data.commentsCount);
          setNewComment("");
          setShowComments(true);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleShare = () => {
    const shareUrl =
      (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") +
      `/public/media-viewer/${post?._id}`;
    if (navigator.share) {
      navigator.share({
        title: `Check out ${post?.username}'s post`,
        text: post?.media?.caption || "Amazing post!",
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="border border-gray-300 dark:border-neutral-700 max-h-[75%] rounded-lg h-full bg-white dark:bg-neutral-900 shadow-md w-full max-w-3xl">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : post ? (
        <div className="flex flex-col lg:flex-row w-full h-full min-h-0 flex-1">
          <div className="w-full lg:flex-1 h-full min-h-0 bg-black rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none flex items-center justify-center overflow-hidden">
            {post.media?.resource_type === "video" ? (
              <video
                src={post.media?.url || ""}
                controls
                playsInline
                className="object-contain w-full h-full max-h-[calc(90vh-250px)] lg:max-h-[90vh]"
              />
            ) : post.media?.resource_type === "image" ? (
              <div className="relative z-50 w-full h-full min-h-[300px] lg:min-h-full">
                <Image
                  src={post.media?.url || ""}
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
          <div className="flex flex-col items-center">
            {post.media?.url && (
              <div className="w-full lg:w-80 xl:w-96 h-full min-h-0 bg-white dark:bg-neutral-900 rounded-b-lg lg:rounded-r-lg max-lg:h-[90%] lg:rounded-bl-none overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="flex-shrink-0 h-14 flex max-lg:hidden items-center px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
                    {post?.avatarUrl ? (
                      <div className="relative w-10 h-10 flex-shrink-0 mr-3">
                        <Image
                          src={post?.avatarUrl || "/default-avatar.svg"}
                          fill
                          className="rounded-full object-cover"
                          alt={post?.username || "User"}
                        />
                      </div>
                    ) : (
                      <DefaultAvatar />
                    )}
                    <span className="truncate text-base font-medium text-neutral-900 dark:text-white">
                      {post?.username || "Unknown User"}
                    </span>
                  </div>
                  <div className="flex-shrink-0 p-4 pb-2">
                    <div className="mb-1 ">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white mr-2">
                        {post?.username || "unknown"}
                      </span>
                      <span className="text-neutral-700 text-sm dark:text-neutral-300">
                        {post.media?.caption || post.media?.caption}
                      </span>
                    </div>
                    {post.media?.uploadedAt && (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2">
                        {new Date(post.media.uploadedAt).toLocaleDateString(
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
                      {commentsCount === 0 ? (
                        <div className="text-center text-neutral-500 py-4">
                          No comments yet.
                        </div>
                      ) : comments && comments.length > 0 ? (
                        <div className="space-y-3">
                          {comments.map((comment: CommentType, idx: number) => {
                            let username =
                              comment.userId?.username ||
                              comment.user?.username ||
                              "User";
                            let avatarUrl = "/default-avatar.svg";
                            if (
                              comment.userId &&
                              typeof comment.userId === "object" &&
                              (comment.userId as any).avatarUrl
                            ) {
                              avatarUrl = (comment.userId as any).avatarUrl;
                            } else if (
                              comment.user &&
                              typeof comment.user === "object" &&
                              (comment.user as any).avatarUrl
                            ) {
                              avatarUrl = (comment.user as any).avatarUrl;
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
                                  <div className="w-7 h-7 rounded-full relative overflow-hidden flex-shrink-0">
                                    <Image
                                      src={avatarUrl}
                                      fill
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
                      ) : (
                        <div className="text-center text-neutral-500 py-4">
                          Loading comments...
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
                          <span>{likesCount}</span>
                        </button>
                        <button
                          onClick={() => setShowComments((prev) => !prev)}
                          className="flex items-center space-x-2 transition-colors hover:text-blue-500"
                        >
                          <MessageCircle className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                          <span>{commentsCount}</span>
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex items-center space-x-2 transition-colors hover:text-green-500"
                        >
                          <Share className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <div className="flex items-center space-x-3">
                      {post?.avatarUrl ? (
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={post?.avatarUrl || "/default-avatar.svg"}
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
            )}
          </div>
        </div>
      ) : (
        <div>Post not found.</div>
      )}
    </div>
  );
};

export default Media;
