'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/HomePg/Navbar';
import ChatList from '@/components/Chat/ChatList';
import ChatInterface from '@/components/Chat/ChatInterface';
import { SocketProvider } from '@/lib/SocketContext';
import { useToast } from '@/hooks/use-toast';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    const searchParams = useSearchParams();
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
            
            if (userId && username) {
                try {
                    // Create or get existing chat room with this user
                    const response = await fetch(`http://localhost:5000/api/v1/chat/room/${userId}`, {
                        credentials: 'include',
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        setSelectedChat(data.data);
                        setRefreshTrigger(prev => prev + 1); // Trigger ChatList refresh
                        // Clear query parameters from URL without page reload
                        window.history.replaceState({}, '', window.location.pathname);
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
    }, [searchParams, toast]);

    const handleSelectChat = (chatRoom) => {
        setSelectedChat(chatRoom);
    };

    const handleBackToList = () => {
        setSelectedChat(null);
    };

    return (
        <SocketProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Show navbar only on desktop or when no chat is selected on mobile */}
                {(!isMobile || !selectedChat) && <Navbar />}
                
                {/* Add left margin to account for fixed navbar width on desktop */}
                <div className={`transition-all duration-300 ${
                    !isMobile 
                        ? 'ml-[15rem] py-6 px-4' 
                        : selectedChat 
                            ? 'p-0' 
                            : 'py-6 px-4'
                }`}>
                    <div className={`rounded-lg overflow-hidden ${
                        isMobile && selectedChat ? 'rounded-none' : ''
                    }`} style={{ 
                        height: isMobile && selectedChat ? '100vh' : 'calc(100vh - 48px)' 
                    }}>
                        <div className="flex h-full">
                            {/* Chat List Sidebar */}
                            <div className={`${
                                isMobile 
                                    ? (selectedChat ? 'hidden' : 'w-full') 
                                    : 'w-1/3 border-r'
                            }`}>
                                <ChatList 
                                    onSelectChat={handleSelectChat}
                                    selectedChatId={selectedChat?.chatId}
                                    refreshTrigger={refreshTrigger}
                                />
                            </div>

                            {/* Chat Interface */}
                            <div className={`${
                                isMobile 
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
                                    />                                ) : (
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
        </SocketProvider>
    );
};

export default ChatPage;
