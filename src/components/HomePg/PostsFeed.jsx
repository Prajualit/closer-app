'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api'
import Post from '@/components/ui/Post'
import { Skeleton } from '@/components/ui/skeleton'
import LoadingButton from '../Loadingbutton'

const PostsFeed = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const scrollPositionRef = useRef(0)

    const LoadingSkeleton = () => (
        <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 mb-6 animate-pulse">
            <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-full"></div>
                <div className="flex-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-600 rounded w-16"></div>
                </div>
            </div>
            <div className="w-full aspect-square bg-neutral-200 dark:bg-neutral-600"></div>
            <div className="p-4">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-32 mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-full mb-1"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-3/4"></div>
            </div>
        </div>
    )

    const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
        if (loading && !reset) return

        if (reset) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }
        setError(null)

        try {
            const response = await makeAuthenticatedRequest(
                `${API_ENDPOINTS.POSTS}?page=${pageNum}&limit=10`,
                {
                    method: 'GET',
                }
            )

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success && data.data.posts) {
                setPosts(prev => reset ? data.data.posts : [...prev, ...data.data.posts])
                setHasMore(data.data.hasMore)
                setPage(pageNum)
            } else {
                throw new Error(data.message || 'Failed to fetch posts')
            }
        } catch (error) {
            console.error('Error fetching posts:', error)
            setError(error.message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [loading])

    const loadMorePosts = useCallback(() => {
        if (!loading && hasMore && !refreshing) {
            fetchPosts(page + 1, false)
        }
    }, [fetchPosts, loading, hasMore, page, refreshing])

    useEffect(() => {
        fetchPosts(1, true)
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            scrollPositionRef.current = window.pageYOffset

            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 1000
            ) {
                loadMorePosts()
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [loadMorePosts])

    const handleLike = (postId, liked) => {
        // TODO: Implement like functionality with API
        console.log(`Post ${postId} ${liked ? 'liked' : 'unliked'}`)
    }

    const handleComment = (postId, comment) => {
        // TODO: Implement comment functionality with API
        console.log(`Comment on post ${postId}:`, comment)
    }

    const handleRefresh = () => {
        setPosts([])
        setPage(1)
        setHasMore(true)
        setError(null)
        fetchPosts(1, true)
    }

    const handlePullToRefresh = () => {
        if (!loading) {
            handleRefresh()
        }
    }

    if (error && posts.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <div className="text-4xl mb-4">😔</div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Unable to load posts</h3>
                    <p className="text-neutral-600 mb-4">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col items-center bg-neutral-50 dark:bg-neutral-900 min-h-screen">
            {/* Refresh Indicator */}
            {refreshing && (
                <div className="w-full max-w-md mb-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refreshing...
                    </div>
                </div>
            )}

            {/* Refresh Button */}
            {!refreshing && (
                <div className="w-full max-w-md mb-4">
                    <LoadingButton
                        onClick={handleRefresh}
                        disabled={loading}
                        className="!bg-white hover:!bg-neutral-50 !text-black  "
                    >
                        {loading && posts.length === 0 ? 'Loading...' : '↻ Refresh Feed'}
                    </LoadingButton>
                </div>
            )}

            {/* Posts */}
            <div className="">
                {posts.map((post, index) => (
                    <div key={`${post._id}-${post.media._id}-${index}`} className="fade-in">
                        <Post
                            post={post}
                            onLike={handleLike}
                            onComment={handleComment}
                        />
                    </div>
                ))}
            </div>

            {/* Loading Skeletons */}
            {loading && !refreshing && (
                <>
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                </>
            )}

            {/* Load More Button */}
            {!loading && hasMore && posts.length > 0 && (
                <div className="w-full max-w-md mb-6">
                    <button
                        onClick={loadMorePosts}
                        className="w-full py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-blue-200"
                    >
                        Load More Posts
                    </button>
                </div>
            )}

            {/* No More Posts Message */}
            {!loading && !hasMore && posts.length > 0 && (
                <div className="w-full max-w-md text-center py-8">
                    <div className="text-2xl mb-2">🎉</div>
                    <p className="text-neutral-500 text-sm">You've reached the end!</p>
                    <p className="text-neutral-400 text-xs mt-1">Check back later for new posts</p>
                </div>
            )}

            {/* No Posts Message */}
            {!loading && posts.length === 0 && !error && !refreshing && (
                <div className="w-full max-w-md text-center py-16">
                    <div className="text-neutral-400 text-6xl mb-4">📸</div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">No posts yet</h3>
                    <p className="text-neutral-600 mb-4">Be the first to share something amazing!</p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        Refresh
                    </button>
                </div>
            )}

            {/* Error Message for Failed Load More */}
            {error && posts.length > 0 && (
                <div className="w-full max-w-md text-center py-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm mb-2">Failed to load more posts</p>
                        <button
                            onClick={() => fetchPosts(page + 1, false)}
                            className="text-red-600 text-sm font-medium hover:text-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PostsFeed
