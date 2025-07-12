import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { X, Upload, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { updateUser } from '@/redux/slice/userSlice';
import { useToast } from '@/hooks/use-toast';

const CreateFilmModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const modalRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state) => state.user.user);

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please select a video smaller than 100MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [previewUrl]);

  // Handle video play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Format time for display
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extract hashtags from caption
  const extractHashtags = (text) => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      // Extract and add hashtags
      const extractedHashtags = extractHashtags(caption);
      if (extractedHashtags.length > 0) {
        formData.append('hashtags', JSON.stringify(extractedHashtags));
      }

      const response = await fetch('http://localhost:5000/api/v1/create', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(updateUser({ media: data.data.media }));
        
        toast({
          title: 'Film uploaded!',
          description: 'Your film has been shared successfully',
        });

        // Close modal and reset
        onClose();
        resetForm();
        
        // Navigate to films page
        router.push(`/${user.username}/films`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload film',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setCaption('');
    setHashtags('');
    setIsPlaying(false);
    setIsMuted(true);
    setDuration(0);
    setCurrentTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (uploading) return;
    resetForm();
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !uploading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, uploading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold">Create Film</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!file ? (
            // File selection
            <div className="text-center">
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 hover:border-neutral-400 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-lg font-medium mb-2">Select a video to share</p>
                <p className="text-neutral-500 mb-6">
                  Choose a video file from your device (max 100MB)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black text-white px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Select Video
                </button>
              </div>
            </div>
          ) : (
            // Video preview and details
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-96 mx-auto">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  muted={isMuted}
                  onClick={togglePlayPause}
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </button>
                </div>

                {/* Volume Control */}
                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Duration */}
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 rounded px-2 py-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Caption Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption... Use #hashtags to make your film discoverable"
                  className="w-full p-3 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500 text-right">
                  {caption.length}/500
                </p>
              </div>

              {/* File Info */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">File Details</h4>
                <div className="text-sm text-neutral-600 space-y-1">
                  <p>Name: {file.name}</p>
                  <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Duration: {formatTime(duration)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={uploading}
                  className="flex-1 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Change Video
                </button>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Share Film</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateFilmModal;
