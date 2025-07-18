'use client';
import React, { useState, useRef, useEffect } from 'react';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';
import { useSocket } from '@/lib/SocketContext';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Heart, MessageCircle, Share, Send } from 'lucide-react';
import NextImage from 'next/image';

const ImageModal = ({ imageUrl, onClose, user, videoUrl }) => {
    const activeMedia = imageUrl || videoUrl;
    let postId = null;
    let mediaId = null;

    // Enhanced ID extraction logic
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

    console.log('Active Media:', activeMedia);
    console.log('Extracted postId:', postId, 'mediaId:', mediaId);

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
    const [mediaError, setMediaError] = useState(false);

    const videoRef = useRef(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (!postId || !mediaId) return;
        setLoadingComments(true);
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

    // Enhanced media URL processing
    const getMediaUrl = (media) => {
        if (!media) return null;
        if (typeof media === 'string') return media;
        if (media.url) return media.url;
        if (media.src) return media.src;
        if (media.path) return media.path;
        return null;
    };

    const handleMediaError = () => {
        setMediaError(true);
        console.error('Media failed to load:', activeMedia);
    };

    return (
        <Dialog open={!!imageUrl || !!videoUrl} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] max-w-7xl h-[95vh] sm:h-[90vh] lg:h-[90vh] max-h-[95vh] sm:max-h-[90vh] lg:max-h-[90vh] border-none p-0 gap-0 !rounded-lg overflow-hidden bg-transparent outline-none">
                <DialogTitle className="sr-only">Media Viewer</DialogTitle>
                <div className="flex flex-col lg:flex-row w-full h-full">
                    {/* Media Section */}
                    <div className="w-full h-[70vh] sm:h-[65vh] lg:h-full lg:flex-1 bg-black rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none overflow-hidden flex items-center justify-center flex-shrink-0 min-h-[400px]">
                        {videoUrl ? (
                            <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                                {!mediaError ? (
                                    <video
                                        ref={videoRef}
                                        src={getMediaUrl(videoUrl)}
                                        controls
                                        playsInline
                                        autoPlay={false}
                                        onError={handleMediaError}
                                        className="object-contain bg-black w-full h-full min-h-[400px] max-w-full"
                                        style={{ background: 'black', display: 'block', minHeight: '400px' }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-white h-full min-h-[400px]">
                                        <div className="text-lg mb-2">⚠️ Video failed to load</div>
                                        <div className="text-sm text-gray-300">URL: {getMediaUrl(videoUrl)}</div>
                                    </div>
                                )}
                            </div>
                        ) : imageUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
                                {!mediaError ? (
                                    <div className="relative w-full h-full min-h-[400px]">
                                        <NextImage
                                            src={getMediaUrl(imageUrl)}
                                            alt={`Enlarged view of ${user?.name || 'the media'}`}
                                            fill
                                            className="object-contain"
                                            priority
                                            sizes="(max-width: 1024px) 100vw, (max-width: 1920px) 70vw, 60vw"
                                            onError={handleMediaError}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-white h-full min-h-[400px]">
                                        <div className="text-lg mb-2">⚠️ Image failed to load</div>
                                        <div className="text-sm text-gray-300">URL: {getMediaUrl(imageUrl)}</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full h-full min-h-[400px]">
                                <span className="text-white text-sm">No media available</span>
                            </div>
                        )}
                    </div>

                    {/* Info Section - FIXED HEIGHT WITH SCROLLABLE CONTENT */}
                    <div className="w-full lg:w-80 xl:w-96 bg-white dark:bg-neutral-900 rounded-b-lg lg:rounded-r-lg lg:rounded-bl-none overflow-hidden flex flex-col flex-1 lg:h-full min-h-0 h-[25vh] sm:h-[30vh]">

                        {/* Scrollable Content Container */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Header with User Info */}
                            <div className="flex-shrink-0 h-14 flex items-center px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
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
                            <div className="flex-shrink-0 p-4 pb-2">
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

                            {/* Comments Section */}
                            <div className="border-t border-neutral-200 dark:border-neutral-700">
                                <div className="px-4 pt-4 pb-2">
                                    <h1 className='text-lg font-semibold'>Comments</h1>
                                </div>
                                <div className="px-4 pb-4">
                                    {loadingComments ? (
                                        <div className="text-center text-neutral-500 py-4">Loading comments...</div>
                                    ) : comments.length === 0 ? (
                                        <div className="text-center text-neutral-500 py-4">No comments yet.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {comments.map((comment, idx) => {
                                                let username = 'User';
                                                let avatarUrl = '/default-avatar.svg';
                                                if (comment.userId && typeof comment.userId === 'object') {
                                                    username = comment.userId.username || 'User';
                                                    avatarUrl = comment.userId.avatarUrl || '/default-avatar.svg';
                                                } else if (comment.username) {
                                                    username = comment.username;
                                                }
                                                const text = comment.text || '[No text]';
                                                let createdAt = '';
                                                try {
                                                    createdAt = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '';
                                                } catch (e) {
                                                    createdAt = '';
                                                }
                                                return (
                                                    <div key={comment._id || idx} className="flex items-start space-x-3">
                                                        <div className='w-7 h-7 rounded-full overflow-hidden flex-shrink-0'>
                                                            <NextImage
                                                                src={avatarUrl}
                                                                width={28}
                                                                height={28}
                                                                className="rounded-full object-cover"
                                                                alt={username}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
                                                                <div className="font-semibold text-sm text-neutral-900 dark:text-white">{username}</div>
                                                                <div className="text-sm text-neutral-700 dark:text-neutral-300 break-words">{text}</div>
                                                            </div>
                                                            {createdAt && (
                                                                <div className="text-xs text-neutral-500 ml-3 mt-1">{createdAt}</div>
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

                        {/* Fixed Bottom Section - Like/Comment/Share + Input */}
                        <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
                            {/* Like, Comment, Share Row */}
                            <div className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handleLike}
                                            disabled={loadingLike}
                                            className="flex items-center space-x-2 transition-colors hover:text-red-500 disabled:opacity-50 focus:outline-none focus:ring-0 border-none"
                                            style={{ border: 'none', outline: 'none' }}
                                        >
                                            <Heart
                                                className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-neutral-600 dark:text-neutral-400'}`}
                                            />
                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                {likesCount}
                                            </span>
                                        </button>
                                        <button className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none" disabled>
                                            <MessageCircle className="w-6 h-6" />
                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                                {commentsCount}
                                            </span>
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none"
                                        >
                                            <Share className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comment Input */}
                            <div className="p-4 pt-0">
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
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors focus:outline-none"
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