import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Pause, VolumeX, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import CommentModal from './CommentModal';

const FilmItem = ({ 
  film, 
  isActive, 
  onLike, 
  onComment, 
  onShare, 
  onVideoEnd,
  muted,
  onMuteToggle 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(film.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(film.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(film.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const playPromiseRef = useRef(null);
  const { toast } = useToast();

  // Update comment count when film prop changes
  useEffect(() => {
    setCommentsCount(film.commentsCount || 0);
  }, [film.commentsCount]);

  const { ref, inView } = useInView({
    threshold: 0.7,
    triggerOnce: false,
  });

  // Auto play/pause based on visibility and active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;

    const playVideo = async () => {
      try {
        // Check if video is ready to play
        if (video.readyState < 3) {
          // Wait for video to be ready
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              video.removeEventListener('canplay', handleCanPlay);
              resolve();
            };
            
            if (video.readyState >= 3) {
              resolve();
            } else {
              video.addEventListener('canplay', handleCanPlay);
              // Fallback timeout
              setTimeout(resolve, 2000);
            }
          });
        }

        if (!isMounted) return;

        // Cancel any previous play promise
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {
            // Ignore errors from cancelled promises
          });
          playPromiseRef.current = null;
        }

        if (!isMounted) return;

        // Start new play promise
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
        
        if (isMounted) {
          setIsPlaying(true);
        }
        playPromiseRef.current = null;
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.warn('Video autoplay failed:', error);
        }
        playPromiseRef.current = null;
      }
    };

    const pauseVideo = async () => {
      try {
        // Wait for any pending play promise before pausing
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {
            // Ignore play promise errors when we're about to pause
          });
          playPromiseRef.current = null;
        }
        
        if (isMounted) {
          video.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.warn('Video pause failed:', error);
      }
    };

    if (isActive && inView) {
      playVideo();
    } else {
      pauseVideo();
    }

    return () => {
      isMounted = false;
    };
  }, [isActive, inView]);

  // Handle video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onVideoEnd]);

  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      console.warn('Video element not found');
      return;
    }

    console.log('Play/Pause clicked. Current playing state:', isPlaying);
    console.log('Video source:', video.src);
    console.log('Video ready state:', video.readyState);

    try {
      if (isPlaying) {
        // Wait for any pending play promise before pausing
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {});
          playPromiseRef.current = null;
        }
        video.pause();
        setIsPlaying(false);
        console.log('Video paused');
      } else {
        // Cancel any previous play promise
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {});
        }
        
        // Check if video is ready to play
        if (video.readyState < 3) {
          console.log('Video not ready, waiting...');
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              video.removeEventListener('canplay', handleCanPlay);
              console.log('Video ready to play');
              resolve();
            };
            
            if (video.readyState >= 3) {
              resolve();
            } else {
              video.addEventListener('canplay', handleCanPlay);
              // Fallback timeout
              setTimeout(() => {
                console.log('Video ready timeout');
                resolve();
              }, 3000);
            }
          });
        }
        
        // Start new play promise
        console.log('Starting video play...');
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
        setIsPlaying(true);
        playPromiseRef.current = null;
        console.log('Video playing');
      }
    } catch (error) {
      console.error('Video play/pause error:', error);
      if (error.name !== 'AbortError') {
        console.warn('Video play/pause failed:', error);
        toast({
          title: 'Playback Error',
          description: 'Failed to play video. Please try again.',
          variant: 'destructive',
        });
      }
      playPromiseRef.current = null;
    }
  }, [isPlaying, toast]);

  const handleLike = async () => {
    if (loading) return;
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    setLoading(true);

    try {
      const endpoint = newLikedState ? API_ENDPOINTS.LIKE_POST : API_ENDPOINTS.UNLIKE_POST;
      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          postId: film._id,
          mediaId: film.media._id.toString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLikesCount(data.data.likesCount);
          onLike?.(`${film._id}-${film.media._id}`, newLikedState);
        }
      } else {
        // Revert on error
        setIsLiked(!newLikedState);
        setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error liking film:', error);
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      toast({
        title: 'Error',
        description: 'Failed to like film',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    setShowComments(true);
    onComment?.(film._id);
  };

  const handleCommentUpdate = (newCount) => {
    setCommentsCount(newCount);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${film.username}'s film`,
          text: film.caption || 'Amazing film!',
          url: `${window.location.origin}/film/${film._id}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/film/${film._id}`);
        toast({
          title: 'Link copied!',
          description: 'Film link copied to clipboard',
        });
      }
      onShare?.(film._id);
    } catch (error) {
      console.error('Error sharing film:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending play promises on unmount
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore errors from cancelled promises
        });
        playPromiseRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full h-screen bg-black flex">
      {/* Left Side - User Info */}
      <div className="flex-1 flex flex-col justify-end p-4 text-white z-10 min-w-0">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              fill
              className="rounded-full object-cover border-2 border-white"
              src={film.avatarUrl || '/default-avatar.svg'}
              alt={`${film.username}'s avatar`}
              onError={(e) => {
                e.target.src = '/default-avatar.svg';
              }}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{film.username}</h3>
            <p className="text-xs opacity-75 truncate">{formatTimeAgo(film.media?.uploadedAt || film.uploadedAt)}</p>
          </div>
        </div>

        {/* Caption */}
        {(film.media?.caption || film.caption) && (
          <p className="text-sm mb-4 leading-relaxed max-w-xs line-clamp-3">
            {film.media?.caption || film.caption}
          </p>
        )}

        {/* Hashtags */}
        {film.hashtags && film.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {film.hashtags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs text-blue-300">#{tag}</span>
            ))}
            {film.hashtags.length > 3 && (
              <span className="text-xs text-gray-400">+{film.hashtags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Center - Video Container */}
      <div className="relative flex-shrink-0 w-72 sm:w-80 md:w-96 h-full flex items-center justify-center">
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain rounded-lg"
          src={film.media?.url || film.url}
          loop
          muted={muted}
          playsInline
          preload="metadata"
          onClick={handlePlayPause}
          onLoadStart={() => console.log('Video load started')}
          onLoadedData={() => console.log('Video data loaded')}
          onCanPlay={() => console.log('Video can play')}
          onError={(e) => {
            console.error('Video error:', e);
            toast({
              title: 'Video Error',
              description: 'Failed to load video',
              variant: 'destructive',
            });
          }}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer rounded-lg"
            onClick={handlePlayPause}
          >
            <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white opacity-90" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Action Controls */}
      <div className="flex-1 flex flex-col justify-center items-end p-4 z-10">
        {/* Volume Control */}
        <button
          onClick={onMuteToggle}
          className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30 mb-6"
        >
          {muted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-6">
          {/* Like */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                isLiked 
                  ? 'bg-red-500 bg-opacity-80' 
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
            >
              <Heart 
                className={`w-6 h-6 ${isLiked ? 'text-white fill-white' : 'text-white'}`}
              />
            </button>
            <span className="text-white text-xs mt-1 font-medium">{likesCount}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleComment}
              className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30 hover:scale-110"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
            <span className="text-white text-xs mt-1 font-medium">{commentsCount}</span>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30 hover:scale-110"
          >
            <Share className="w-6 h-6 text-white" />
          </button>

          {/* More Options */}
          <button className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30 hover:scale-110">
            <MoreHorizontal className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        film={film}
        onCommentUpdate={handleCommentUpdate}
      />
    </div>
  );
};

export default FilmItem;
