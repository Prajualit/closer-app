'use client';
import React, { useState, useRef, useEffect } from 'react';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';
import { useSocket } from '@/lib/SocketContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Heart, MessageCircle, Share, Send } from 'lucide-react';
import NextImage from 'next/image';


const ImageModal = ({ imageUrl, onClose, user, videoUrl }) => {

    // Determine which media is active: image or video
    const activeMedia = imageUrl || videoUrl;
    // Always extract postId as the user _id (owner of the media), and mediaId as the media _id
    let postId = null;
    let mediaId = null;
    // Try to get user _id from the user prop or from activeMedia.post/userInfo
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

    // Try to get media _id from media prop, or from imageUrl/videoUrl/mediaId
    if (activeMedia?.media?._id) {
        mediaId = activeMedia.media._id;
    } else if (activeMedia?.mediaId) {
        mediaId = activeMedia.mediaId;
    } else if (imageUrl?.mediaId) {
        mediaId = imageUrl.mediaId;
    } else if (videoUrl?.mediaId) {
        mediaId = videoUrl.mediaId;
    } else if (activeMedia?._id && activeMedia?.url) {
        // If this is a media object itself
        mediaId = activeMedia._id;
    }

    // Debug logs for ID extraction
    console.log('Active Media:', activeMedia);
    console.log('Extracted postId:', postId, 'mediaId:', mediaId);

    // State for interactive elements
    const [isLiked, setIsLiked] = useState(
        typeof activeMedia?.isLikedByCurrentUser === 'boolean' ? activeMedia.isLikedByCurrentUser : false
    );
    const [likesCount, setLikesCount] = useState(
        typeof activeMedia?.likesCount === 'number' ? activeMedia.likesCount : 0
    );
    const [commentsCount, setCommentsCount] = useState(
        typeof activeMedia?.commentsCount === 'number' ? activeMedia.commentsCount : 0
    );
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [loadingLike, setLoadingLike] = useState(false);
    const [loadingComment, setLoadingComment] = useState(false);

    // Video ref for possible future use
    const videoRef = useRef(null);
    const { socket } = useSocket();

    // Fetch comments and likes count on open
    useEffect(() => {
        if (!postId || !mediaId) return;
        setLoadingComments(true);
        // Fetch comments
        makeAuthenticatedRequest(API_ENDPOINTS.GET_COMMENTS(postId, mediaId), { method: 'GET' })
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    console.log('Fetched comments data:', data);
                    setComments(Array.isArray(data.data?.comments) ? data.data.comments : []);
                    setCommentsCount(
                        typeof data.data?.totalComments === 'number' ? data.data.totalComments : 0
                    );
                } else {
                    console.warn('Failed to fetch comments:', res.status);
                }
            })
            .catch((err) => {
                console.error('Error fetching comments:', err);
            })
            .finally(() => setLoadingComments(false));

        // Fetch likes count
        makeAuthenticatedRequest(API_ENDPOINTS.GET_LIKES_COUNT(postId, mediaId), { method: 'GET' })
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.data?.likesCount === 'number') {
                        setLikesCount(data.data.likesCount);
                    }
                    if (typeof data.data?.isLikedByCurrentUser === 'boolean') {
                        setIsLiked(data.data.isLikedByCurrentUser);
                    }
                } else {
                    console.warn('Failed to fetch likes count:', res.status);
                }
            })
            .catch((err) => {
                console.error('Error fetching likes count:', err);
            });
    }, [postId, mediaId]);

    // Real-time updates via socket
    useEffect(() => {
        if (!socket || !postId || !mediaId) return;
        const handleLikeUpdate = (payload) => {
            if (payload.postId === postId && payload.mediaId === mediaId) {
                setLikesCount(payload.likesCount);
                setIsLiked(payload.isLikedByCurrentUser);
            }
        };
        const handleCommentUpdate = (payload) => {
            if (payload.postId === postId && payload.mediaId === mediaId) {
                setCommentsCount(payload.commentsCount);
                setComments((prev) => [payload.comment, ...prev]);
            }
        };
        socket.on('like_update', handleLikeUpdate);
        socket.on('comment_update', handleCommentUpdate);
        return () => {
            socket.off('like_update', handleLikeUpdate);
            socket.off('comment_update', handleCommentUpdate);
        };
    }, [socket, postId, mediaId]);

    // Like handler
    // Like handler (works for all users and all profiles)
    const handleLike = async () => {
        if (!postId || !mediaId || loadingLike) return;
        setLoadingLike(true);
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount((prev) => newLikedState ? Math.max(0, prev + 1) : Math.max(0, prev - 1));
        try {
            const endpoint = newLikedState ? API_ENDPOINTS.LIKE_POST : API_ENDPOINTS.UNLIKE_POST;
            const res = await makeAuthenticatedRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ postId, mediaId })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Like API response:', data);
                setLikesCount(
                    typeof data.data?.likesCount === 'number'
                        ? data.data.likesCount
                        : (newLikedState ? likesCount + 1 : Math.max(0, likesCount - 1))
                );
                setIsLiked(
                    typeof data.data?.isLikedByCurrentUser === 'boolean'
                        ? data.data.isLikedByCurrentUser
                        : newLikedState
                );
            } else {
                setIsLiked(!newLikedState);
                setLikesCount((prev) => newLikedState ? Math.max(0, prev - 1) : prev + 1);
            }
        } catch (e) {
            setIsLiked(!newLikedState);
            setLikesCount((prev) => newLikedState ? Math.max(0, prev - 1) : prev + 1);
            console.error('Like API error:', e);
        } finally {
            setLoadingLike(false);
        }
    };

    // Add comment handler
    // Add comment handler (works for all users and all profiles)
    const handleAddComment = async () => {
        if (!newComment.trim() || !postId || !mediaId || loadingComment) return;
        setLoadingComment(true);
        try {
            const res = await makeAuthenticatedRequest(API_ENDPOINTS.ADD_COMMENT, {
                method: 'POST',
                body: JSON.stringify({ postId, mediaId, text: newComment.trim() })
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Add comment API response:', data);
                if (data.success && data.data?.comment) {
                    setComments((prev) => [data.data.comment, ...prev]);
                    setCommentsCount(
                        typeof data.data?.commentsCount === 'number'
                            ? data.data.commentsCount
                            : commentsCount + 1
                    );
                    setNewComment('');
                }
            } else {
                console.warn('Failed to add comment:', res.status);
            }
        } catch (e) {
            console.error('Add comment error:', e);
        } finally {
            setLoadingComment(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Check out ${user?.name || 'this'} media`,
                text: activeMedia?.caption || 'Amazing content!',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    // Get the media URL - handle both object with url property and direct URL
    const getMediaUrl = (media) => {
        if (!media) return null;
        if (typeof media === 'string') return media;
        return media.url || null;
    };

    return (
        <Dialog open={!!imageUrl || !!videoUrl} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] max-w-7xl h-[90vh] border-none p-0 gap-0 !rounded-lg overflow-hidden bg-transparent outline-none">
                <DialogTitle className="sr-only">Media Viewer</DialogTitle>
                <div className="flex flex-col lg:flex-row w-full h-full">
                    {/* Media Section */}
                    <div className="w-full lg:flex-1 bg-black rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none overflow-hidden flex items-center justify-center">
                        {videoUrl ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <video
                                    ref={videoRef}
                                    src={getMediaUrl(videoUrl)}
                                    controls
                                    playsInline
                                    autoPlay={false}
                                    className="object-contain bg-black w-full h-full max-h-[90vh] max-w-full"
                                    style={{ background: 'black', display: 'block' }}
                                />
                            </div>
                        ) : imageUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <NextImage
                                    src={getMediaUrl(imageUrl)}
                                    alt={`Enlarged view of ${user?.name || 'the media'}`}
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, (max-width: 1920px) 70vw, 60vw"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full h-full">
                                <span className="text-white text-sm">No media available</span>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-neutral-900 rounded-b-lg lg:rounded-r-lg lg:rounded-bl-none overflow-hidden">
                        {/* Header with User Info */}
                        <div className="flex-shrink-0 h-14 flex items-center px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                            <div className='relative w-10 h-10 flex-shrink-0 mr-3'>
                                <NextImage
                                    src={user?.avatarUrl || '/default-avatar.svg'}
                                    fill
                                    className='rounded-full object-cover'
                                    alt={user?.name || 'User'}
                                />
                            </div>
                            <span className="truncate text-base font-medium text-neutral-900 dark:text-white">
                                {user?.name || user?.username || 'Unknown User'}
                            </span>
                        </div>

                        {/* Caption Section */}
                        <div className="p-4 pb-2">
                            <div className="mb-1">
                                <span className="font-semibold text-sm text-neutral-900 dark:text-white mr-2">
                                    {user?.username || user?.name || 'unknown'}
                                </span>
                                <span className="text-neutral-700 text-sm dark:text-neutral-300">
                                    {imageUrl?.caption || videoUrl?.caption}
                                </span>
                            </div>
                            {activeMedia?.uploadedAt && (
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2">
                                    {new Date(activeMedia.uploadedAt).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4  border-t border-neutral-200 dark:border-neutral-700">
                            <h1 className='text-lg mb-4'>Comments</h1>
                            {loadingComments ? (
                                <div className="text-center text-neutral-500 py-2">Loading comments...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-center text-neutral-500 py-2">No comments yet.</div>
                            ) : (
                                (() => {
                                    console.log('Rendering comments:', comments);
                                    return comments.map((comment, idx) => {
                                        let username = 'User';
                                        let avatarUrl = '/default-avatar.svg';
                                        // Defensive: handle both populated and unpopulated userId
                                        if (comment.userId && typeof comment.userId === 'object') {
                                            username = comment.userId.username || 'User';
                                            avatarUrl = comment.userId.avatarUrl || '/default-avatar.svg';
                                        } else if (comment.username) {
                                            username = comment.username;
                                        }
                                        // Fallback for missing text or createdAt
                                        const text = comment.text || '[No text]';
                                        let createdAt = '';
                                        try {
                                            createdAt = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '';
                                        } catch (e) {
                                            createdAt = '';
                                        }
                                        return (
                                            <div key={comment._id || idx} className="flex items-start space-x-2 mb-2">
                                                <div className='w-[28px] h-[28px] rounded-full overflow-hidden'>
                                                    <NextImage
                                                        src={avatarUrl}
                                                        width={28}
                                                        height={28}
                                                        className="rounded-full object-cover"
                                                        alt={username}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-[8px] px-3 py-2 space-y-1 flex flex-col">
                                                        <span className="font-semibold text-sm mr-1">{username}</span>
                                                        <span className="text-sm font-light text-neutral-900 dark:text-white">{text}</span>
                                                    </div>
                                                    {createdAt && (
                                                        <span className="text-[10px] text-neutral-500 ml-2">{createdAt}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>

                        {/* Like, Comment, Share Row */}
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {/* Like Button */}
                                    <button
                                        onClick={handleLike}
                                        disabled={loadingLike}
                                        className="flex items-center space-x-2 transition-colors hover:text-red-500 disabled:opacity-50"
                                    >
                                        <Heart
                                            className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-neutral-600 dark:text-neutral-400'}`}
                                        />
                                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                            {likesCount}
                                        </span>
                                    </button>

                                    {/* Comment Button */}
                                    <button className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors" disabled>
                                        <MessageCircle className="w-6 h-6" />
                                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                            {commentsCount}
                                        </span>
                                    </button>

                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    >
                                        <Share className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="p-4 pt-0 ">
                            <div className="flex items-center space-x-3">
                                <div className="relative w-8 h-8 flex-shrink-0">
                                    <NextImage
                                        src={user?.avatarUrl || '/default-avatar.svg'}
                                        fill
                                        className="rounded-full object-cover"
                                        alt="Your avatar"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 pr-12 text-sm border-none outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-white placeholder-neutral-500"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
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
            </DialogContent>
        </Dialog>
    );
};

export default ImageModal;