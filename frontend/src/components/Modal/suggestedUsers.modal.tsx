'use client'
import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import LoadingButton from '@/components/LoadingButton'

interface SuggestedUser {
    _id: string;
    username: string;
    name: string;
    avatarUrl?: string;
    followersCount?: number;
    isFollowed: boolean;
}

interface SuggestedUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestedUsers: SuggestedUser[];
    onFollow: (userId: string) => void;
}

const SuggestedUsersModal: React.FC<SuggestedUsersModalProps> = ({ isOpen, onClose, suggestedUsers, onFollow }) => {
    const router = useRouter()

    const handleProfileClick = (userId: string) => {
        router.push(`/profile/${userId}`)
        onClose() // Close modal when navigating
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-md max-h-[90vh] bg-white dark:bg-neutral-800 p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg font-semibold dark:text-white">
                        Suggested for you ({suggestedUsers?.filter((user: SuggestedUser) => !user.isFollowed).length || 0})
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto max-sm:scrollbar-hide pr-2">
                    <div className="space-y-2 sm:space-y-3">
                        {suggestedUsers && suggestedUsers.length > 0 ? (
                            suggestedUsers.filter((user: SuggestedUser) => !user.isFollowed).map((user: SuggestedUser) => (
                                <div key={user._id} className="flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700 py-2 sm:py-3 px-2 rounded-lg transition-all duration-200">
                                    <div
                                        className="flex items-center space-x-2 sm:space-x-3 flex-1 cursor-pointer"
                                        onClick={() => handleProfileClick(user._id)}
                                    >
                                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                            <Image
                                                src={user.avatarUrl || '/default-avatar.svg'}
                                                alt={user.name}
                                                fill
                                                className="rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate">
                                                {user.username}
                                            </h4>
                                            <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                                                {user.followersCount || 0} followers
                                            </p>
                                        </div>
                                    </div>
                                    {user.isFollowed ? (
                                        <LoadingButton
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                e.stopPropagation();
                                            }}
                                            className="!text-xs sm:!text-sm !w-fit !h-fit !transition-colors"
                                            pending={false}
                                        >
                                            Followed
                                        </LoadingButton>
                                    ) : (
                                        <LoadingButton
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                e.stopPropagation();
                                                onFollow(user._id);
                                            }}
                                            className="!text-xs sm:!text-sm !w-fit !h-fit !transition-colors"
                                            pending={false}
                                        >
                                            Follow
                                        </LoadingButton>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-neutral-500 dark:text-neutral-400">No suggested users found</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SuggestedUsersModal
