import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { X, Heart, Send } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { API_ENDPOINTS, makeAuthenticatedRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface User {
  _id: string;
  username?: string;
  avatarUrl?: string;
}

interface Comment {
  _id: string;
  userId: User;
  text: string;
  createdAt: string;
}

interface Media {
  _id: string | number;
}

interface Film {
  _id: string;
  media: Media;
  commentsCount?: number;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  film: Film;
  onCommentUpdate?: (count: number) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  film,
  onCommentUpdate,
}) => {
  // All state and refs at the very top
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const currentUser = useSelector(
    (state: { user: { user: User } }) => state.user.user
  );

  // Now define loadComments after all state/refs
  const loadComments = React.useCallback(
    async (reset: boolean = true) => {
      if (loadingComments || !hasMore) return;

      setLoadingComments(true);
      try {
        const response = await makeAuthenticatedRequest(
          `${API_ENDPOINTS.GET_COMMENTS(film._id, film.media._id)}?page=${reset ? 1 : page}&limit=20`,
          {
            method: "GET",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newComments: Comment[] = data.data?.comments || [];

          if (reset) {
            setComments(newComments);
            setPage(2);

            // Update initial comment count if available
            if (onCommentUpdate && data.data?.totalComments !== undefined) {
              onCommentUpdate(data.data.totalComments);
            }
          } else {
            setComments((prev: Comment[]) => [...prev, ...newComments]);
            setPage((prev) => prev + 1);
          }

          if (newComments.length < 20) {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoadingComments(false);
      }
    },
    [loadingComments, hasMore, film, page, onCommentUpdate]
  );

  // Now place the useEffect that uses loadComments after its declaration
  useEffect(() => {
    if (isOpen && film) {
      loadComments();
    }
  }, [isOpen, film, loadComments]);
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current && textareaRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleAddComment = async (): Promise<void> => {
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        API_ENDPOINTS.ADD_COMMENT,
        {
          method: "POST",
          body: JSON.stringify({
            postId: film._id,
            mediaId: film.media._id.toString(),
            text: newComment.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments((prev: Comment[]) => [data.data.comment, ...prev]);
          setNewComment("");

          // Update comment count in parent component
          if (onCommentUpdate && data.data.commentsCount) {
            onCommentUpdate(data.data.commentsCount);
          } else if (onCommentUpdate) {
            // Fallback: increment current count
            onCommentUpdate((film.commentsCount || 0) + 1);
          }

          // Auto-resize textarea
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    // Stop propagation to prevent parent component interference
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Stop propagation for all key events to prevent interference
    e.stopPropagation();
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    // Stop propagation to prevent interference
    e.stopPropagation();
    setNewComment(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const handleTextareaFocus = (
    e: React.FocusEvent<HTMLTextAreaElement>
  ): void => {
    // Stop propagation when focusing
    e.stopPropagation();
  };

  const handleTextareaClick = (
    e: React.MouseEvent<HTMLTextAreaElement>
  ): void => {
    // Stop propagation when clicking
    e.stopPropagation();
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  if (!isOpen) return null;

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Stop propagation when clicking inside the modal
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-modal="true"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[95vw] sm:max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col animate-slide-up mx-auto"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-base sm:text-lg text-neutral-900 dark:text-white">
            Comments
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingComments && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3">
                  {comment.userId?.avatarUrl ? (
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image
                        fill
                        className="rounded-full object-cover"
                        src={comment.userId?.avatarUrl || "/default-avatar.svg"}
                        alt={`${comment.userId?.username}'s avatar`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/default-avatar.svg";
                        }}
                      />
                    </div>
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

                  <div className="flex-1 min-w-0">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
                      <p className="font-semibold text-sm">
                        {comment.userId?.username}
                      </p>
                      <p className="text-sm text-neutral-900 break-words dark:text-white">
                        {comment.text}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 mt-1 px-3">
                      <span className="text-xs text-neutral-500">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <button
                  onClick={() => loadComments(false)}
                  disabled={loadingComments}
                  className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                >
                  {loadingComments ? "Loading..." : "Load more comments"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-600">
          <div className="flex items-center space-x-3">
            {currentUser?.avatarUrl ? (
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  fill
                  className="rounded-full object-cover"
                  src={currentUser?.avatarUrl || "/default-avatar.svg"}
                  alt="Your avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.svg";
                  }}
                />
              </div>
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

            <div className="flex-1 relative items-center justify-center">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                onKeyDown={handleKeyDown}
                onFocus={handleTextareaFocus}
                onClick={handleTextareaClick}
                placeholder="Add a comment..."
                className="w-full bg-neutral-100 rounded-full px-4 py-2 pr-12 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-colors
                                dark:bg-neutral-800 dark:ring-neutral-600 dark:text-white dark:focus:bg-neutral-700"
                rows={1}
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />

              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || loading}
                className="absolute right-2 top-[10%] transform  w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
