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
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const { toast } = useToast();

  const { ref, inView } = useInView({
    threshold: 0.7,
    triggerOnce: false,
  });

  // Auto play/pause based on visibility and active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && inView) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.warn('Video autoplay failed:', error);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
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

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      });
    }
  }, [isPlaying]);

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
          postId: film.userId,
          mediaId: film._id.toString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLikesCount(data.data.likesCount);
          onLike?.(film._id, newLikedState);
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

  return (
    <div ref={ref} className="relative w-full h-screen bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={film.url}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={handlePlayPause}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer"
          onClick={handlePlayPause}
        >
          <Play className="w-20 h-20 text-white opacity-80" fill="white" />
        </div>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-20 left-4 right-20 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative w-12 h-12">
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
          <div>
            <h3 className="font-semibold text-sm">{film.username}</h3>
            <p className="text-xs opacity-75">{formatTimeAgo(film.uploadedAt)}</p>
          </div>
        </div>

        {/* Caption */}
        {film.caption && (
          <p className="text-sm mb-2 pr-4 leading-relaxed">
            {film.caption}
          </p>
        )}

        {/* Hashtags */}
        {film.hashtags && film.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {film.hashtags.map((tag, index) => (
              <span key={index} className="text-xs text-blue-300">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-20 right-4 flex flex-col items-center space-y-6">
        {/* Like */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleLike}
            disabled={loading}
            className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30"
          >
            <Heart 
              className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`}
            />
          </button>
          <span className="text-white text-xs mt-1 font-medium">{likesCount}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleComment}
            className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <span className="text-white text-xs mt-1 font-medium">{film.commentsCount || 0}</span>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30"
        >
          <Share className="w-6 h-6 text-white" />
        </button>

        {/* More Options */}
        <button className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30">
          <MoreHorizontal className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Volume Control */}
      <button
        onClick={onMuteToggle}
        className="absolute top-20 right-4 w-10 h-10 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-opacity-30"
      >
        {muted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Comment Modal */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        film={film}
      />
    </div>
  );
};

export default FilmItem;
