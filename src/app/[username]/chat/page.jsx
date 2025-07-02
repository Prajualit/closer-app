'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/HomePg/Navbar';
import ChatList from '@/components/Chat/ChatList';
import ChatInterface from '@/components/Chat/ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const hasProcessedInitialParams = useRef(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle query parameters to automatically open a chat
    useEffect(() => {
        const initializeChat = async () => {
            const userId = searchParams.get('userId');
            const username = searchParams.get('username');
            const chatId = searchParams.get('chatId');

            // Skip if we already have a selected chat AND it matches the URL chatId (prevents re-initialization)
            if (selectedChat && chatId && selectedChat.chatId === chatId) {
                setIsInitializing(false);
                return;
            }

            // If we already processed initial params and now only have chatId, skip (this means URL was updated after chat creation)
            if (hasProcessedInitialParams.current && chatId && !userId && !username) {
                setIsInitializing(false);
                return;
            }

            // If we have a chatId in URL (from page refresh), let ChatList handle the auto-selection
            if (chatId && !userId && !username && !hasProcessedInitialParams.current) {
                setIsInitializing(false);
                hasProcessedInitialParams.current = true;
                return;
            }

            // If no parameters at all, just finish initialization
            if (!userId && !username && !chatId) {
                setIsInitializing(false);
                hasProcessedInitialParams.current = true;
                return;
            }

            // Handle opening chat from profile (userId + username) - only once
            if (userId && username && !hasProcessedInitialParams.current) {
                hasProcessedInitialParams.current = true;
                try {
                    // Create or get existing chat room with this user
                    const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHAT_ROOM(userId));
                    const data = await response.json();

                    if (data.success) {
                        setSelectedChat(data.data);
                        // No need to trigger ChatList refresh since the chat already exists or will be added by startNewChat
                        
                        // Update URL to use chatId instead of userId/username for persistence
                        // Use direct window.history to prevent navigation effects
                        const newUrl = `${window.location.pathname}?chatId=${data.data.chatId}`;
                        window.history.replaceState(null, '', newUrl);
                    } else {
                        toast({
                            title: 'Error',
                            description: `Failed to open chat with ${username}`,
                            variant: 'destructive',
                        });
                    }
                } catch (error) {
                    console.error('Error opening chat from profile:', error);
                    toast({
                        title: 'Error',
                        description: `Failed to open chat with ${username}`,
                        variant: 'destructive',
                    });
                }
            }
            setIsInitializing(false);
        };

        initializeChat();
    }, [searchParams, toast]); // Removed selectedChat and router from dependencies

    const handleSelectChat = useCallback((chatRoom) => {
        console.log('Selecting chat:', chatRoom.chatId);
        setSelectedChat(chatRoom);
        // Update URL to persist the selected chat, but only if it's different
        const currentChatId = searchParams.get('chatId');
        if (currentChatId !== chatRoom.chatId) {
            // Use replace instead of push to avoid navigation history issues
            const newUrl = `${window.location.pathname}?chatId=${chatRoom.chatId}`;
            window.history.replaceState(null, '', newUrl);
        }
    }, [searchParams]);

    const handleBackToList = useCallback(() => {
        console.log('Going back to chat list');
        setSelectedChat(null);
        hasProcessedInitialParams.current = false; // Reset for potential new navigation
        // Clear chatId from URL when going back to list
        const currentChatId = searchParams.get('chatId');
        if (currentChatId) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Show navbar only on desktop or when no chat is selected on mobile */}
            {(!isMobile || !selectedChat) && <Navbar />}

            {/* Add left margin to account for fixed navbar width on desktop */}
            <div className={`transition-all duration-300 ${!isMobile
                    ? 'ml-[15rem] py-6 px-4'
                    : selectedChat
                        ? 'p-0'
                        : 'py-6 px-4'
                }`}>
                <div className={`rounded-lg overflow-hidden ${isMobile && selectedChat ? 'rounded-none' : ''
                    }`} style={{
                        height: isMobile && selectedChat ? '100vh' : 'calc(100vh - 48px)'
                    }}>
                    <div className="flex h-full">
                        {/* Chat List Sidebar */}
                        <div className={`${isMobile
                                ? (selectedChat ? 'hidden' : 'w-full')
                                : 'w-1/3 border-r'
                            }`}>
                            <ChatList
                                onSelectChat={handleSelectChat}
                                selectedChatId={selectedChat?.chatId}
                                refreshTrigger={refreshTrigger}
                                autoSelectChatId={searchParams.get('chatId')}
                            />
                        </div>

                        {/* Chat Interface */}
                        <div className={`${isMobile
                                ? (selectedChat ? 'w-full' : 'hidden')
                                : 'flex-1'
                            }`}>
                            {isInitializing ? (
                                <div className="flex items-center justify-center h-full bg-gray-50">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-500">Opening chat...</p>
                                    </div>
                                </div>
                            ) : selectedChat ? (
                                <ChatInterface
                                    chatRoom={selectedChat}
                                    onBack={handleBackToList}
                                />) : (
                                !isInitializing && (
                                    <div className="flex items-center justify-center h-full bg-gray-50">
                                        <div className="text-center">
                                            <div className="text-gray-400 mb-4">
                                                <svg
                                                    className="w-24 h-24 mx-auto"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1}
                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-medium text-gray-600 mb-2">
                                                Select a conversation
                                            </h3>
                                            <p className="text-gray-500">
                                                Choose from your existing conversations or start a new one
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
