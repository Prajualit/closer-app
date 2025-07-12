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
            <DialogContent className="flex w-fit min-w-[60%] h-[80%] justify-center border-none p-0 gap-0 !rounded-lg overflow-hidden bg-transparent">
                {videoUrl ? (
                    <div className="w-fit min-w-[40%] max-w-[50%] flex items-center object-contain bg-[#181818] dark:bg-black rounded-l-lg">
                        <video
                            src={videoUrl.url}
                            controls
                            className="object-contain w-full rounded-l-lg"
                            width={400}
                            height={400}
                            playsInline
                        />
                    </div>
                ) : imageUrl ? (
                    <div className="w-full h-full flex items-center object-contain bg-[#181818] dark:bg-black rounded-l-lg">
                        <NextImage
                            src={imageUrl.url}
                            alt={`Enlarged view of ${user?.name || 'the media'}`}
                            width={400}
                            height={400}
                            className="object-contain w-full rounded-l-lg"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-[#181818] dark:bg-black rounded-l-lg">
                        <span className="text-white">No media available</span>
                    </div>
                )}
                <div className="flex flex-col w-full rounded-r-lg overflow-hidden">
                    <DialogTitle className="w-full h-[3rem] flex space-x-2 items-center px-3 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 rounded-tr-lg text-neutral-900 dark:text-white">
                        <div className='relative w-[32px] h-[32px]'>
                            <NextImage
                                src={user?.avatarUrl}
                                fill
                                className='rounded-full object-cover'
                                alt=""
                            />
                        </div>
                        <span>{user?.name || 'Unknown User'}</span>
                    </DialogTitle>
                    <DialogDescription className="bg-white dark:bg-neutral-900 w-full flex-1 p-3 flex flex-col gap-2 rounded-br-lg text-neutral-900 dark:text-neutral-300">
                        <span>
                            <span className="font-semibold">{user?.username || 'unknown'}</span>
                            &nbsp;{imageUrl?.caption || videoUrl?.caption}
                        </span>
                        <span className='text-[13px] text-neutral-500 dark:text-neutral-400 font-semibold '>
                            {activeMedia?.uploadedAt
                                ? new Date(activeMedia.uploadedAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })
                                : 'N/A'}
                        </span>
                    </DialogDescription>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageModal;