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

const ImageModal = ({ imageUrl, onClose, user }) => {



    return (
        <Dialog open={!!imageUrl} onOpenChange={onClose}>
            <DialogContent className="flex  w-[50%] border-none p-0 gap-0 rounded-lg overflow-hidden">
                {imageUrl && (
                    <NextImage
                        src={imageUrl}
                        alt="Enlarged view"
                        width={400}
                        height={400}
                        className="object-cover"
                    />
                )}
                <div className="flex flex-col items-center justify-center w-full flex-1">
                    <DialogTitle className="w-full h-[3rem] flex items-center px-3 bg-white border-[#0000003c] ">
                        <span className=''>
                            {user?.name}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="h-full bg-white w-full flex-1 p-3 flex flex-col " >
                        <p>
                            <span className='font-semibold'>
                                {user?.username}
                            </span>
                            <span>
                                &nbsp;Lorem ipsum dolor sit, amet consectetur adipisicing elit. Soluta rerum mollitia dolore sunt! Quibusdam, quas?
                            </span>
                        </p>
                        <span>
                            {user?.media[0]?.uploadedAt?.slice(0, 10)}
                        </span>
                    </DialogDescription>
                </div>
            </DialogContent>
        </Dialog >

    );
};

export default ImageModal;
