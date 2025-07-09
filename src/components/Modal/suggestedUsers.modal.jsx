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
import LoadingButton from '../Loadingbutton'

const SuggestedUsersModal = ({ isOpen, onClose, suggestedUsers, onFollow }) => {
    const router = useRouter()

    const handleProfileClick = (userId) => {
        router.push(`/profile/${userId}`)
        onClose() // Close modal when navigating
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] bg-white overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Suggested for you</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="space-y-1">
                        {suggestedUsers.map((user) => (
                            <div key={user._id} className="flex items-center justify-between hover:bg-gray-50 py-3 px-2 rounded-lg transition-all duration-200">
                                <div
                                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                                    onClick={() => handleProfileClick(user._id)}
                                >
                                    <div className="relative w-12 h-12">
                                        <Image
                                            src={user.avatarUrl || '/default-avatar.svg'}
                                            alt={user.name}
                                            fill
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {user.username}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {user.followersCount || 0} followers
                                        </p>
                                    </div>
                                </div>
                                <LoadingButton
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onFollow(user._id)
                                    }}
                                    className="px-4 py-1.5 text-xs font-medium !w-fit !h-fit transition-colors"
                                >
                                    Follow
                                </LoadingButton>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SuggestedUsersModal
