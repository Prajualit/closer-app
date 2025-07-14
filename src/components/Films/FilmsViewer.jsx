import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Camera, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FilmItem from './FilmItem';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateModal from '@/components/Modal/create.modal.jsx';

const FilmsViewer = ({ initialFilms = [], username }) => {
  const [films, setFilms] = useState(initialFilms);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [muted, setMuted] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const startTouchY = useRef(0);
  const router = useRouter();
  const { toast } = useToast();
  const currentUser = useSelector((state) => state.user.user);

  // Load more films when needed
  const loadMoreFilms = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.POSTS}?page=${page}&limit=10&type=video`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newFilms = data.data?.posts || [];
        
        if (newFilms.length === 0) {
          setHasMore(false);
        } else {
          // Filter out duplicates before adding to state
          setFilms(prev => {
            const existingIds = new Set(prev.map(film => `${film._id}-${film.media._id}`));
            const uniqueNewFilms = newFilms.filter(film => 
              !existingIds.has(`${film._id}-${film.media._id}`)
            );
            return [...prev, ...uniqueNewFilms];
          });
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error loading films:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more films',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, toast]);

  // Intersection Observer to detect which video is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            if (!isNaN(index) && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.7, // Video must be 70% visible to be considered active
      }
    );

    // Observe all film elements
    const filmElements = container.querySelectorAll('[data-index]');
    filmElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [films.length, currentIndex]);

  // Handle scroll/swipe navigation
  const handleScroll = useCallback((direction) => {
    if (isScrolling) return;

    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(films.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      setIsScrolling(true);
      setCurrentIndex(newIndex);
      
      // Scroll to the new film
      const container = containerRef.current;
      if (container) {
        container.scrollTo({
          top: newIndex * window.innerHeight,
          behavior: 'smooth'
        });
      }

      // Load more films if we're near the end
      if (newIndex >= films.length - 3) {
        loadMoreFilms();
      }

      // Reset scrolling flag
      setTimeout(() => setIsScrolling(false), 600);
    }
  }, [currentIndex, films.length, isScrolling, loadMoreFilms]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle keyboard events if there's an active input or textarea focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
      
      // Don't handle keyboard events if a modal is open (check for actual modals)
      const hasModal = document.querySelector('.modal, [role="dialog"], [data-modal="true"]');
      
      if (isInputFocused || hasModal) {
        return; // Don't prevent default or handle the event
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleScroll('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleScroll('down');
          break;
        case ' ':
          e.preventDefault();
          // Toggle play/pause for current film
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setMuted(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll, muted]); // Add muted to dependencies

  // Touch/Swipe navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isScrolling = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      isScrolling = false;
    };

    const handleTouchMove = (e) => {
      if (isScrolling) return;
      
      const currentY = e.touches[0].clientY;
      const diffY = startY - currentY;
      
      if (Math.abs(diffY) > 50) {
        isScrolling = true;
        handleScroll(diffY > 0 ? 'down' : 'up');
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleScroll]);

  // Wheel navigation for desktop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        handleScroll(e.deltaY > 0 ? 'down' : 'up');
      }, 50);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Auto-load initial films if empty
  useEffect(() => {
    if (films.length === 0) {
      loadMoreFilms();
    }
  }, []);

  const handleLike = useCallback((filmId, liked) => {
    setFilms(prev => prev.map(film => 
      `${film._id}-${film.media._id}` === filmId 
        ? { ...film, isLikedByCurrentUser: liked, likesCount: film.likesCount + (liked ? 1 : -1) }
        : film
    ));
  }, []);

  const handleComment = useCallback((filmId) => {
    // Handle comment action
  }, []);

  const handleShare = useCallback((filmId) => {
    // Handle share action
  }, []);

  const handleVideoEnd = useCallback(() => {
    // Auto-advance to next film when current one ends
    handleScroll('down');
  }, [handleScroll]);

  const goBack = () => {
    router.back();
  };

  const goToCreateFilm = () => {
    setShowCreateModal(true);
  };

  if (films.length === 0 && !loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
        <Camera className="w-20 h-20 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">No Films Yet</h2>
        <p className="text-neutral-400 mb-8 text-center">
          Be the first to share a film!
        </p>
        <button
          onClick={goToCreateFilm}
          className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Film</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <h1 className="text-white font-semibold text-lg">Films</h1>
        
        <button
          onClick={goToCreateFilm}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Films Container */}
      <div
        ref={containerRef}
        className="h-full overflow-hidden"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {films.map((film, index) => (
          <div
            key={`${film._id}-${film.media._id}`}
            data-index={index}
            className="h-screen"
            style={{ scrollSnapAlign: 'start' }}
          >
            <FilmItem
              film={film}
              isActive={index === currentIndex}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onVideoEnd={handleVideoEnd}
              muted={muted}
              onMuteToggle={() => setMuted(prev => !prev)}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Navigation Instructions (show briefly on first visit) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-75 text-center">
        <p>Swipe up/down or use arrow keys to navigate</p>
        <p className="mt-1">Press M to toggle sound</p>
      </div>
      
      {/* Create Modal */}
      <CreateModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};

export default FilmsViewer;
