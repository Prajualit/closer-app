'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'

const Post = ({ post, onLike, onComment }) => {
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser || false)
    const [likesCount, setLikesCount] = useState(post.likesCount || 0)
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
    const [comments, setComments] = useState(post.comments || [])
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLike = async () => {
        const newLikedState = !isLiked
        setIsLiked(newLikedState)
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1)

        try {
            const endpoint = newLikedState ? API_ENDPOINTS.LIKE_POST : API_ENDPOINTS.UNLIKE_POST
            const response = await makeAuthenticatedRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    postId: post._id,
                    mediaId: post.media._id.toString()
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setLikesCount(data.data.likesCount)
                }
            } else {
                // Revert on error
                setIsLiked(!newLikedState)
                setLikesCount(prev => newLikedState ? prev - 1 : prev + 1)
            }
        } catch (error) {
            console.error('Error liking/unliking post:', error)
            // Revert on error
            setIsLiked(!newLikedState)
            setLikesCount(prev => newLikedState ? prev - 1 : prev + 1)
        }

        if (onLike) onLike(post._id, newLikedState)
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || loading) return

        setLoading(true)
        try {
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.ADD_COMMENT, {
                method: 'POST',
                body: JSON.stringify({
                    postId: post._id,
                    mediaId: post.media._id.toString(),
                    text: newComment.trim()
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setComments(prev => [data.data.comment, ...prev])
                    setCommentsCount(data.data.commentsCount)
                    setNewComment('')
                    if (onComment) onComment(post._id, data.data.comment)
                }
            }
        } catch (error) {
            console.error('Error adding comment:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Check out ${post.username}'s post`,
                text: post.media.caption || 'Amazing post!',
                url: window.location.href
            })
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    const FavouriteIcon = ({ size = 24, color = "#000000", filled = false }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={filled ? color : "none"}
                role="img"
                className="cursor-pointer transition-colors hover:text-red-500"
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

    const CommentIcon = ({ size = 24, color = "#000000" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                className="cursor-pointer transition-colors hover:text-blue-500"
            >
                <path
                    d="M8.5 19H8C4 19 2 17 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M15.9965 11H16.0054"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M11.9955 11H12.0045"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M7.99451 11H8.00349"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const ShareIcon = ({ size = 24, color = "#000000" }) => {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                className="cursor-pointer transition-colors hover:text-green-500"
            >
                <path
                    d="M16.96 6.17004C18.96 7.56004 20.34 9.77004 20.62 12.32"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M3.49 12.37C3.75 9.83997 5.11 7.63997 7.09 6.23997"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M8.19 20.9399C9.35 21.5299 10.67 21.8599 12.06 21.8599C13.4 21.8599 14.66 21.5599 15.79 21.0099"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M12.06 7.70001C13.5954 7.70001 14.84 6.45537 14.84 4.92001C14.84 3.38466 13.5954 2.14001 12.06 2.14001C10.5247 2.14001 9.28003 3.38466 9.28003 4.92001C9.28003 6.45537 10.5247 7.70001 12.06 7.70001Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    const formatUploadDate = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true })
        } catch (error) {
            return 'Recently'
        }
    }

    const isVideo = (url) => {
        return url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('video'))
    }

    return (
        <div className='w-full max-w-[470px] bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700'>
            {/* Post Header */}
            <div className='p-4 flex items-center justify-start space-x-3'>
                <div className="relative w-10 h-10">
                    <Image
                        fill
                        className='rounded-full object-cover'
                        src={post.avatarUrl || '/default-avatar.svg'}
                        alt={`${post.username}'s avatar`}
                        onError={(e) => {
                            e.target.src = '/default-avatar.svg'
                        }}
                    />
                </div>
                <div className='flex-1'>
                    <h2 className='font-semibold text-sm text-neutral-900 dark:text-white'>{post.username}</h2>
                    <p className='text-xs text-neutral-500 dark:text-neutral-400'>{formatUploadDate(post.media.uploadedAt)}</p>
                </div>
                <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {/* Post Media */}
            <div className='relative w-full aspect-square bg-neutral-100'>
                {isVideo(post.media.url) ? (
                    <video
                        className='w-full h-full object-contain'
                        controls
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                        }}
                    >
                        <source src={post.media.url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <Image
                        fill
                        className='object-contain'
                        src={post.media.url || '/placeholder-image.svg'}
                        alt={post.media.caption || 'Post media'}
                        onError={(e) => {
                            e.target.src = '/placeholder-image.svg'
                        }}
                    />
                )}
                {/* Video error fallback */}
                <div className="hidden w-full h-full items-center justify-center bg-neutral-200">
                    <div className="text-center text-neutral-500 dark:text-neutral-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Media unavailable</p>
                    </div>
                </div>
            </div>

            {/* Post Actions */}
            <div className='p-4'>
                <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-4'>
                        <button onClick={handleLike} className='scale-animation'>
                            <FavouriteIcon
                                size={24}
                                color={isLiked ? "#ef4444" : "#000000"}
                                filled={isLiked}
                            />
                        </button>
                        <button onClick={() => setShowComments(!showComments)} className='scale-animation'>
                            <CommentIcon />
                        </button>
                        <button onClick={handleShare} className='scale-animation'>
                            <ShareIcon />
                        </button>
                    </div>
                </div>

                {/* Likes Count */}
                <div className='mb-2 flex space-x-2'>
                    <span className='font-semibold text-sm text-neutral-900 dark:text-white'>{likesCount.toLocaleString()} like{likesCount === 1 ? "" : "s"}</span>
                    <span className='font-semibold text-sm text-neutral-900 dark:text-white'>{commentsCount.toLocaleString()} comment{commentsCount === 1 ? "" : "s"}</span>
                </div>

                {/* Caption */}
                {post.media.caption && (
                    <div className='mb-2'>
                        <span className='font-semibold text-sm mr-2 text-neutral-900 dark:text-white'>{post.username}</span>
                        <span className='text-sm text-neutral-800 dark:text-neutral-200'>{post.media.caption}</span>
                    </div>
                )}

                {/* View Comments */}
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors mb-2"
                >
                    View all comments
                </button>

                {/* Comments Section */}
                {showComments && (
                    <div className='mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 slide-up'>
                        <div className='space-y-2 mb-3 max-h-32 overflow-y-auto scrollbar-hide'>
                            {comments.length > 0 ? (
                                comments.map((comment, index) => (
                                    <div key={comment._id || index} className="text-sm">
                                        <span className="font-semibold mr-2">
                                            {comment.userId?.username || comment.user?.username}
                                        </span>
                                        <span className="text-neutral-800">{comment.text}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">No comments yet</div>
                            )}
                        </div>
                        <div className='flex items-center space-x-2'>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className='flex-1 text-sm border-none outline-none bg-transparent placeholder-neutral-400'
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddComment()
                                    }
                                }}
                                disabled={loading}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || loading}
                                className='text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Post
