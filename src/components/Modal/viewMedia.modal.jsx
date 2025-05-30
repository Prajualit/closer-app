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
            <DialogContent className="flex flex-col md:flex-row w-full md:w-[50%] border-none p-0 gap-0 rounded-lg overflow-hidden">
                {videoUrl ? (
                    <video
                        src={videoUrl.url}
                        controls
                        className="object-cover"
                        width={400}
                        height={400}
                        playsInline
                    />
                ) : imageUrl ? (
                    <NextImage
                        src={imageUrl.url}
                        alt={`Enlarged view of ${user?.name || 'the media'}`}
                        width={400}
                        height={400}
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200">
                        <span>No media available</span>
                    </div>
                )}
                <div className="flex flex-col w-full flex-1">
                    <DialogTitle className="w-full h-[3rem] flex space-x-2 items-center px-3 bg-white border-[#0000003c]">
                        <NextImage
                            src={user?.avatarUrl}
                            width={28}
                            height={28}
                            className='rounded-full'
                            alt=""
                        />
                        <span>{user?.name || 'Unknown User'}</span>
                    </DialogTitle>
                    <DialogDescription className="bg-white w-full flex-1 p-3 flex flex-col gap-2">
                        <span>
                            <span className="font-semibold">{user?.username || 'unknown'}</span>
                            &nbsp;Lorem ipsum dolor sit, amet consectetur adipisicing elit. Soluta rerum mollitia dolore sunt! Quibusdam, quas?
                        </span>
                        <span className='text-[13px] text-gray-500 font-semibold '>
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
