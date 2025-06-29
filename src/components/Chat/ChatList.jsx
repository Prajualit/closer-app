'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChatList = ({ onSelectChat, selectedChatId }) => {
    const [chatRooms, setChatRooms] = useState([]);
    const [searchUsers, setSearchUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

    const userDetails = useSelector((state) => state.user.user);
    const { toast } = useToast();

    useEffect(() => {
        fetchChatRooms();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchUsersFunction();
        } else {
            setSearchUsers([]);
        }
    }, [searchQuery]);

    const fetchChatRooms = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/v1/chat/rooms', {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setChatRooms(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
            toast({
                title: 'Error',
                description: 'Failed to load chat rooms',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const searchUsersFunction = async () => {
        try {
            setSearchLoading(true);
            const response = await fetch(`http://localhost:5000/api/v1/users/search?query=${searchQuery}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                // Filter out current user and users already in chat rooms
                const existingChatUserIds = chatRooms.flatMap(room =>
                    room.participants.map(p => p._id)
                );

                const filteredUsers = (data.data || []).filter(user =>
                    user._id !== userDetails._id &&
                    !existingChatUserIds.includes(user._id)
                );

                setSearchUsers(filteredUsers);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const startNewChat = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/chat/room/${userId}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                onSelectChat(data.data);
                setSearchQuery('');
                setSearchUsers([]);
                // Refresh chat rooms to include the new one
                fetchChatRooms();
            }
        } catch (error) {
            console.error('Error starting new chat:', error);
            toast({
                title: 'Error',
                description: 'Failed to start new chat',
                variant: 'destructive',
            });
        }
    };

    const formatLastActivity = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getOtherParticipant = (participants) => {
        return participants.find(p => p._id !== userDetails?._id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading chats...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b ">
                <h2 className="text-xl font-semibold mb-4">Messages</h2>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for users..."
                        className="pl-10 outline-none border-none shadow-md hover:shadow-lg transition-shadow duration-300 focus:!shadow-lg bg-white"
                    />
                </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
                <div className="border-b bg-gray-50">
                    <div className="p-2">
                        <div className="text-sm font-medium text-gray-600 mb-2">
                            {searchLoading ? 'Searching...' : 'Start new conversation'}
                        </div>
                        <div className='flex flex-col space-y-2'>
                            {searchUsers.length > 0 ? (
                                searchUsers.map((user) => (
                                    <button
                                        key={user._id}
                                        onClick={() => startNewChat(user._id)}
                                        className="w-full bg-white flex items-center space-x-3 p-5 hover:shadow-lg shadow-md focus:shadow-lg rounded-[10px] transition-all duration-300 "
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <Image
                                                src={user.avatarUrl}
                                                alt={user.name}
                                                width={40}
                                                height={40}
                                                className="object-cover bg-center rounded-full"
                                            />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-gray-500">@{user.username}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-400" />
                                    </button>
                                ))
                            ) : !searchLoading && (
                                <div className="text-sm text-gray-500 p-2">
                                    No users found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat List */}
            <ScrollArea className="flex-1 mt-3">
                {chatRooms.length > 0 ? (
                    <div className="divide-y">
                        {chatRooms.map((chatRoom) => {
                            const otherParticipant = getOtherParticipant(chatRoom.participants);
                            const isSelected = selectedChatId === chatRoom.chatId;

                            return (
                                <button
                                    key={chatRoom._id}
                                    onClick={() => onSelectChat(chatRoom)}
                                    className={`w-full rounded-l-xl flex items-center space-x-3 p-4 transition-colors ${isSelected ? 'bg-[#ededed] border-r-2' : 'hover:bg-[#f3f3f3] transition-colors duration-300'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                        <Image
                                            src={otherParticipant?.avatarUrl || '/default-avatar.png'}
                                            alt={otherParticipant?.name || 'User'}
                                            width={48}
                                            height={48}
                                            className="object-cover bg-center rounded-full"
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{otherParticipant?.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatLastActivity(chatRoom.lastActivity)}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {chatRoom.lastMessage?.content || 'Start a conversation...'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    !searchQuery && (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No conversations yet</h3>
                            <p className="text-gray-500">Search for users above to start a new conversation</p>
                        </div>
                    )
                )}
            </ScrollArea>
        </div>
    );
};

export default ChatList;
