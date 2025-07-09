'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Plus, Info, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';
import { useSocket } from '@/lib/SocketContext';
import LoadingButton from '../Loadingbutton';

const ChatList = ({ onSelectChat, selectedChatId, refreshTrigger, autoSelectChatId, chatRooms, setChatRooms }) => {
    const [searchUsers, setSearchUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [hasAutoSelected, setHasAutoSelected] = useState(false);

    const userDetails = useSelector((state) => state.user.user);
    const router = useRouter();
    const { toast } = useToast();
    const { socket } = useSocket();

    // Initialize chatRooms if not provided externally
    const [internalChatRooms, setInternalChatRooms] = useState([]);
    const actualChatRooms = chatRooms || internalChatRooms;
    const actualSetChatRooms = setChatRooms || setInternalChatRooms;

    useEffect(() => {
        fetchChatRooms();
    }, [refreshTrigger]); // Only depend on refreshTrigger, not fetchChatRooms

    // Listen for real-time message updates to update chat list
    useEffect(() => {
        if (socket) {
            const handleChatUpdate = (messageData) => {
                // Only update if the message is for a chat that exists in our list
                actualSetChatRooms(prev => {
                    const roomExists = prev.some(room => room.chatId === messageData.chatId);
                    if (!roomExists) {
                        return prev; // Don't update if chat doesn't exist in our list
                    }

                    console.log('Updating chat list for message:', messageData.chatId);
                    const updatedRooms = prev.map(room => {
                        if (room.chatId === messageData.chatId) {
                            // Check if this message is from another user (not current user)
                            const isFromOtherUser = messageData.sender._id !== userDetails?._id;
                            return {
                                ...room,
                                lastMessage: {
                                    content: messageData.message,
                                    timestamp: messageData.timestamp
                                },
                                lastActivity: messageData.timestamp,
                                // Increment unread count only if message is from another user and this chat is not currently selected
                                unreadCount: isFromOtherUser && selectedChatId !== messageData.chatId
                                    ? (room.unreadCount || 0) + 1
                                    : (room.unreadCount || 0)
                            };
                        }
                        return room;
                    });
                    // Sort by last activity (most recent first)
                    return updatedRooms.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
                });
            };

            socket.on('receive-message', handleChatUpdate);

            return () => {
                socket.off('receive-message', handleChatUpdate);
            };
        }
    }, [socket, userDetails, selectedChatId]);

    // Auto-select chat when chatRooms are loaded and we have an autoSelectChatId
    // Only run this once per autoSelectChatId to prevent loops
    useEffect(() => {
        if (autoSelectChatId && actualChatRooms.length > 0 && !hasAutoSelected && selectedChatId !== autoSelectChatId) {
            const chatToSelect = actualChatRooms.find(room => room.chatId === autoSelectChatId);
            if (chatToSelect && onSelectChat) {
                console.log('Auto-selecting chat:', autoSelectChatId);
                onSelectChat(chatToSelect);
                setHasAutoSelected(true);
            }
        }
    }, [actualChatRooms, autoSelectChatId, selectedChatId, hasAutoSelected]); // Removed onSelectChat from dependencies

    // Reset hasAutoSelected when autoSelectChatId changes (new chat to auto-select)
    useEffect(() => {
        setHasAutoSelected(false);
    }, [autoSelectChatId]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchUsersFunction();
        } else {
            setSearchUsers([]);
        }
    }, [searchQuery]);

    const fetchChatRooms = useCallback(async () => {
        try {
            console.log('Fetching chat rooms...');
            setLoading(true);
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHAT_ROOMS);
            const data = await response.json();

            if (data.success) {
                actualSetChatRooms(data.data || []);
                console.log('Chat rooms fetched:', data.data?.length || 0);
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
    }, [toast]);

    const searchUsersFunction = async () => {
        try {
            setSearchLoading(true);
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.USER_SEARCH(searchQuery));
            const data = await response.json();

            if (data.success) {
                // Filter out current user and users already in chat rooms
                const existingChatUserIds = actualChatRooms.flatMap(room =>
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
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHAT_ROOM(userId));
            const data = await response.json();

            if (data.success) {
                onSelectChat(data.data);
                setSearchQuery('');
                setSearchUsers([]);

                // Instead of refetching all chat rooms, just add the new one if it doesn't exist
                actualSetChatRooms(prev => {
                    const exists = prev.some(room => room.chatId === data.data.chatId);
                    if (!exists) {
                        console.log('Adding new chat room to list:', data.data.chatId);
                        return [data.data, ...prev]; // Add to beginning of list
                    }
                    return prev;
                });
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

    // Function to mark messages as read when chat is selected
    const markChatAsRead = async (chatId) => {
        try {
            await makeAuthenticatedRequest(API_ENDPOINTS.MARK_MESSAGES_READ(chatId), {
                method: 'POST'
            });

            // Update local state to reset unread count
            actualSetChatRooms(prev =>
                prev.map(room =>
                    room.chatId === chatId
                        ? { ...room, unreadCount: 0 }
                        : room
                )
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    // Function to update chatbot last message in chat list
    const updateChatbotLastMessage = (message) => {
        actualSetChatRooms(prev => 
            prev.map(room => 
                room.chatId === 'chatbot' 
                    ? { 
                        ...room, 
                        lastMessage: {
                            content: message,
                            timestamp: new Date().toISOString()
                        },
                        lastActivity: new Date().toISOString()
                    }
                    : room
            )
        );
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

    const handleViewProfile = (e, userId) => {
        e.stopPropagation(); // Prevent chat selection
        router.push(`/profile/${userId}`);
    };

    const startChatbotConversation = () => {
        // Create a mock chatbot room object
        const chatbotRoom = {
            chatId: 'chatbot',
            _id: 'chatbot',
            participants: [
                {
                    _id: 'ai-assistant',
                    name: 'Your AI Friend',
                    username: 'ai_companion',
                    avatarUrl: '/chatbot.png'
                }
            ],
            lastMessage: {
                content: 'Hey there! 😊 I\'m so happy you decided to chat with me! How are you really feeling?',
                timestamp: new Date().toISOString()
            },
            lastActivity: new Date().toISOString(),
            unreadCount: 0,
            isChatbot: true
        };

        // Add chatbot room to chat list if it doesn't already exist
        actualSetChatRooms(prev => {
            const chatbotExists = prev.some(room => room.chatId === 'chatbot');
            if (!chatbotExists) {
                return [chatbotRoom, ...prev]; // Add to beginning of list
            }
            return prev;
        });

        onSelectChat(chatbotRoom);
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
                                    <div key={user._id} className="w-full bg-white flex items-center space-x-3 p-3 hover:shadow-lg shadow-md rounded-[10px] transition-all duration-300">
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
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                onClick={(e) => handleViewProfile(e, user._id)}
                                                className="p-2"
                                            >
                                                <Info className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => startNewChat(user._id)}
                                                className="p-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
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
                {actualChatRooms.length > 0 ? (
                    <div className="divide-y">
                        {/* AI Chatbot Option - Only show at top when chatbot is NOT already in the chat list */}
                        {!searchQuery && !actualChatRooms.some(room => room.chatId === 'chatbot') && (
                            <div className="group w-full rounded-l-xl flex items-center space-x-3 p-4 hover:bg-[#f3f3f3] transition-colors duration-300 border-b border-gray-100">
                                <button
                                    onClick={startChatbotConversation}
                                    className="flex items-center space-x-3 flex-1"
                                >
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                        <Image
                                            src="/chatbot.png"
                                            alt="AI Assistant"
                                            width={48}
                                            height={48}
                                            className="object-cover bg-center rounded-full"
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <p className="font-medium text-gray-700">Your AI Friend</p>
                                                <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                                                    AI
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-blue-600 truncate">
                                            Your friendly companion →
                                        </p>
                                    </div>
                                </button>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Bot className="w-4 h-4 text-blue-500" />
                                </div>
                            </div>
                        )}

                        {/* Regular chat rooms */}
                        {actualChatRooms.map((chatRoom) => {
                            const otherParticipant = getOtherParticipant(chatRoom.participants);
                            const isSelected = selectedChatId === chatRoom.chatId;
                            const unreadCount = chatRoom.unreadCount || 0;

                            return (
                                <div
                                    key={chatRoom._id}
                                    className={`group w-full rounded-l-xl flex items-center space-x-3 p-4 transition-colors ${isSelected ? 'bg-[#ededed] border-r-2' : 'hover:bg-[#f3f3f3] transition-colors duration-300'}`}
                                >
                                    <button
                                        onClick={() => {
                                            onSelectChat(chatRoom);
                                            // Mark messages as read when chat is selected and has unread messages
                                            if (unreadCount > 0) {
                                                markChatAsRead(chatRoom.chatId);
                                            }
                                        }}
                                        className="flex items-center space-x-3 flex-1"
                                    >
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                            <Image
                                                src={otherParticipant?.avatarUrl || '/default-avatar.png'}
                                                alt={otherParticipant?.name || 'User'}
                                                width={48}
                                                height={48}
                                                className="object-cover bg-center rounded-full"
                                            />
                                            {/* Unread count badge on avatar */}
                                            {unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <p className={`font-medium ${unreadCount > 0 ? 'text-black' : 'text-gray-700'}`}>
                                                        {otherParticipant?.name}
                                                    </p>
                                                    {unreadCount > 0 && (
                                                        <div className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {formatLastActivity(chatRoom.lastActivity)}
                                                </p>
                                            </div>
                                            <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {chatRoom.lastMessage?.content || 'Start a conversation...'}
                                            </p>
                                        </div>
                                    </button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => handleViewProfile(e, otherParticipant?._id)}
                                        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Info className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    !searchQuery && (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No conversations yet</h3>
                            <p className="text-gray-500 mb-6">Search for users above to start a new conversation</p>

                            {/* AI Chatbot Call-to-Action for empty state */}
                            <div className="w-full max-w-sm  ">
                                <div className="bg-white rounded-[15px] shadow-md p-6">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden">
                                            <Image
                                                src="/chatbot.png"
                                                alt="AI Assistant"
                                                width={48}
                                                height={48}
                                                className="object-cover bg-center rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                        Have no one to chat with?
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        I'm here to be your friend! Let's talk about anything - your day, your dreams, your thoughts, or just have a deep conversation like close friends do!
                                    </p>
                                    <LoadingButton
                                        onClick={startChatbotConversation}
                                        size="md"
                                    >
                                        Let's be friends!
                                    </LoadingButton>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </ScrollArea>
        </div>
    );
};

export default ChatList;
