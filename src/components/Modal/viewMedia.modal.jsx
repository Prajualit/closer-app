'use client';
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import NextImage from 'next/image';

const ImageModal = ({ imageUrl, onClose, user, videoUrl }) => {
    // Determine which media is active: image or video
    const activeMedia = imageUrl || videoUrl;

    return (
        <Dialog open={!!imageUrl || !!videoUrl} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-6xl h-[85vh] sm:h-[80vh] md:h-[85vh] border-none p-0 gap-0 !rounded-lg overflow-hidden bg-transparent">
                {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
                <div className="flex flex-col lg:flex-row w-full h-full">
                    {/* Media Section */}
                    <div className="w-full lg:flex-1 flex items-center justify-center bg-[#181818] dark:bg-black rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none overflow-hidden">
                        {videoUrl ? (
                            <video
                                src={videoUrl.url}
                                controls
                                className="object-contain w-full h-full max-h-[60vh] lg:max-h-full"
                                playsInline
                            />
                        ) : imageUrl ? (
                            <NextImage
                                src={imageUrl.url}
                                alt={`Enlarged view of ${user?.name || 'the media'}`}
                                width={800}
                                height={600}
                                className="object-contain w-full h-full max-h-[60vh] lg:max-h-full"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full">
                                <span className="text-white text-sm">No media available</span>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-neutral-900 rounded-b-lg lg:rounded-r-lg lg:rounded-bl-none overflow-hidden">
                        {/* Header with User Info */}
                        <div className="flex-shrink-0">
                            <DialogTitle className="w-full h-12 sm:h-14 flex space-x-3 items-center px-3 sm:px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
                                <div className='relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0'>
                                    <NextImage
                                        src={user?.avatarUrl || '/default-avatar.svg'}
                                        fill
                                        className='rounded-full object-cover'
                                        alt=""
                                    />
                                </div>
                                <span className="truncate text-sm sm:text-base font-medium">{user?.name || 'Unknown User'}</span>
                            </DialogTitle>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 overflow-y-auto">
                            <DialogDescription className="p-3 sm:p-4 flex flex-col gap-3 text-neutral-900 dark:text-neutral-300">
                                {/* Caption */}
                                {(imageUrl?.caption || videoUrl?.caption) && (
                                    <div className="break-words text-sm sm:text-base leading-relaxed">
                                        <span className="font-semibold text-neutral-900 dark:text-white">
                                            {user?.username || 'unknown'}
                                        </span>
                                        <span className="ml-2">{imageUrl?.caption || videoUrl?.caption}</span>
                                    </div>
                                )}

                                {/* Upload Date */}
                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <span className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium'>
                                        {activeMedia?.uploadedAt
                                            ? new Date(activeMedia.uploadedAt).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })
                                            : 'Upload date unavailable'}
                                    </span>
                                </div>

                                {/* Media Details */}
                                <div className="text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
                                    {activeMedia?.size && (
                                        <div>Size: {(activeMedia.size / 1024 / 1024).toFixed(2)} MB</div>
                                    )}
                                </div>
                            </DialogDescription>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageModal;