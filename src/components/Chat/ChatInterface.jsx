'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/lib/SocketContext';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';

const ChatInterface = ({ chatRoom, onBack, onUpdateChatList }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiTyping, setAiTyping] = useState(false);

    const { socket, joinChat, sendMessage, emitTyping, emitStopTyping } = useSocket();
    const userDetails = useSelector((state) => state.user.user);
    const router = useRouter();
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { toast } = useToast();

    // Get the other participant
    const otherParticipant = chatRoom?.participants?.find(p => p._id !== userDetails?._id);
    const isChatbot = chatRoom?.isChatbot || chatRoom?.chatId === 'chatbot';

    // Debug logging for chatbot detection
    useEffect(() => {
        if (chatRoom) {
            console.log('ChatInterface - chatRoom:', {
                chatId: chatRoom.chatId,
                isChatbot: chatRoom.isChatbot,
                participants: chatRoom.participants,
                detectedAsChatbot: isChatbot
            });
        }
    }, [chatRoom, isChatbot]);

    useEffect(() => {
        if (chatRoom?.chatId) {
            console.log('Joining chat and fetching messages for:', chatRoom.chatId, 'isChatbot:', isChatbot);
            if (!isChatbot) {
                joinChat(chatRoom.chatId);
                fetchMessages();
            } else {
                // For chatbot, fetch persisted messages from database
                fetchChatbotMessages();
            }
        }
    }, [chatRoom?.chatId]); // Only depend on chatId, not the whole chatRoom object

    useEffect(() => {
        if (socket) {
            socket.on('receive-message', handleReceiveMessage);
            socket.on('user-typing', handleUserTyping);
            socket.on('user-stop-typing', handleUserStopTyping);

            return () => {
                socket.off('receive-message', handleReceiveMessage);
                socket.off('user-typing', handleUserTyping);
                socket.off('user-stop-typing', handleUserStopTyping);
            };
        }
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            console.log('Fetching messages for chat:', chatRoom.chatId);
            setLoading(true);
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHAT_MESSAGES(chatRoom.chatId));
            const data = await response.json();

            if (data.success) {
                console.log('Fetched messages:', data.data.messages?.length || 0);
                setMessages(data.data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast({
                title: 'Error',
                description: 'Failed to load messages',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchChatbotMessages = async () => {
        try {
            console.log('Fetching chatbot messages');
            setLoading(true);
            const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHATBOT_MESSAGES);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success) {
                console.log('Fetched chatbot messages:', data.data.messages?.length || 0);
                const messages = data.data.messages || [];
                setMessages(messages);
            } else {
                throw new Error(data.message || 'Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching chatbot messages:', error);
            
            toast({
                title: 'Error',
                description: 'Failed to load conversation history',
                variant: 'destructive',
            });
            
            // Set empty messages on error
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChatbotMessage = async (userMessage) => {
        try {
            setAiTyping(true);

            // Add a delay to simulate AI thinking
            setTimeout(async () => {
                try {
                    const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHATBOT_MESSAGE, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: userMessage
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Add AI response directly to messages (real-time, no refresh)
                        const aiMessage = {
                            _id: data.data.messageId || Date.now().toString(),
                            content: data.data.message,
                            sender: {
                                _id: 'ai-assistant',
                                name: 'Your AI Friend',
                                avatarUrl: '/chatbot.png'
                            },
                            timestamp: data.data.timestamp
                        };

                        setMessages(prev => [...prev, aiMessage]);

                        // Update chat list with AI response
                        if (onUpdateChatList) {
                            onUpdateChatList(data.data.message);
                        }
                    }
                } catch (error) {
                    console.error('Error getting AI response:', error);
                    
                    // Add fallback message directly (no database refresh)
                    const fallbackMessage = {
                        _id: Date.now().toString(),
                        content: 'Aw, I\'m having a bit of trouble thinking right now! 😅 Could you try asking me that again? I really want to help!',
                        sender: {
                            _id: 'ai-assistant',
                            name: 'Your AI Friend',
                            avatarUrl: '/chatbot.png'
                        },
                        timestamp: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, fallbackMessage]);

                    // Update chat list with fallback message
                    if (onUpdateChatList) {
                        onUpdateChatList(fallbackMessage.content);
                    }
                } finally {
                    setAiTyping(false);
                }
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        } catch (error) {
            console.error('Error in chatbot message handler:', error);
            setAiTyping(false);
        }
    };

    const handleReceiveMessage = (messageData) => {
        // Check if message already exists (to prevent duplicates from optimistic updates)
        setMessages(prev => {
            // Use a more robust check for duplicates
            const messageExists = prev.some(msg => {
                // Check for exact same message content, sender, and timestamp within 1 second
                const timeDiff = Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp));
                return (
                    msg.sender._id === messageData.sender._id &&
                    msg.message === messageData.message &&
                    timeDiff < 1000 // Within 1 second
                );
            });

            if (messageExists) {
                console.log('Duplicate message detected, skipping:', messageData);
                return prev; // Don't add duplicate
            }

            console.log('Adding new message:', messageData);
            return [...prev, messageData];
        });
    };

    const handleUserTyping = (data) => {
        if (data.userId !== userDetails?._id) {
            setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
        }
    };

    const handleUserStopTyping = (data) => {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        console.log('Sending message:', newMessage.trim());

        const messageText = newMessage.trim();

        // Clear input immediately for better UX
        setNewMessage('');
        handleStopTyping();

        if (isChatbot) {
            // Handle chatbot conversation - show user message immediately, backend handles persistence
            const userMessageData = {
                _id: Date.now().toString(),
                content: messageText,
                sender: {
                    _id: userDetails._id,
                    username: userDetails.username,
                    name: userDetails.name,
                    avatarUrl: userDetails.avatarUrl
                },
                timestamp: new Date().toISOString()
            };

            // Add user message immediately for better UX
            setMessages(prev => [...prev, userMessageData]);
            
            handleChatbotMessage(messageText);
        } else {
            // Handle regular chat with optimistic updates
            const messageData = {
                chatId: chatRoom.chatId,
                message: messageText,
                sender: {
                    _id: userDetails._id,
                    username: userDetails.username,
                    name: userDetails.name,
                    avatarUrl: userDetails.avatarUrl
                },
                timestamp: new Date().toISOString()
            };

            // Optimistically add message to local state immediately
            setMessages(prev => {
                console.log('Adding optimistic message to state');
                return [...prev, messageData];
            });

            // Send via socket
            sendMessage(messageData);

            // Save to database
            try {
                console.log('Saving message to database...');
                const response = await makeAuthenticatedRequest(API_ENDPOINTS.CHAT_MESSAGE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chatId: chatRoom.chatId,
                        content: messageText
                    })
                });
                console.log('Message saved successfully');
            } catch (error) {
                console.error('Error saving message:', error);
                // If saving fails, remove the optimistic message and restore the input
                setMessages(prev => prev.filter(msg => msg !== messageData));
                setNewMessage(messageText); // Restore the message to input if save failed
            }
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            emitTyping(chatRoom.chatId);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 1000);
    };

    const handleStopTyping = () => {
        setIsTyping(false);
        emitStopTyping(chatRoom.chatId);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    const shouldShowDateSeparator = (currentMessage, previousMessage) => {
        if (!previousMessage) return true;

        const currentDate = new Date(currentMessage.timestamp).toDateString();
        const previousDate = new Date(previousMessage.timestamp).toDateString();

        return currentDate !== previousDate;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white dark:bg-neutral-900">
                <div className="text-neutral-500 dark:text-neutral-400">Loading messages...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="md:hidden text-neutral-600 dark:text-neutral-300 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                    >
                        ←
                    </Button>
                    {otherParticipant && (
                        <div
                            className={`flex items-center space-x-2 sm:space-x-3 ${!isChatbot ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700' : ''} rounded-lg p-1 sm:p-2 transition-colors duration-200 min-w-0 flex-1`}
                            onClick={() => !isChatbot && router.push(`/profile/${otherParticipant._id}`)}
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                    src={otherParticipant.avatarUrl}
                                    alt={otherParticipant.name}
                                    width={40}
                                    height={40}
                                    className="object-cover bg-center rounded-full w-full h-full"
                                />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white truncate">{otherParticipant.name}</h3>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">
                                    {isChatbot ? 'Your caring companion' : `@${otherParticipant.username}`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <Button variant="ghost" size="sm" className="text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                    <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-2 sm:p-4 bg-neutral-100 dark:bg-neutral-800 !scrollbar-hide ">
                <div className="space-y-3 sm:space-y-4">
                    {messages.map((message, index) => {
                        const isOwnMessage = message.sender._id === userDetails?._id;
                        const showAvatar = index === 0 ||
                            messages[index - 1].sender._id !== message.sender._id;
                        const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);

                        return (
                            <div key={message._id || index}>
                                {/* Date Separator */}
                                {showDateSeparator && (
                                    <div className="flex justify-center my-4 sm:my-6">
                                        <div className="bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 text-xs px-2 sm:px-3 py-1 rounded-full">
                                            {formatDate(message.timestamp)}
                                        </div>
                                    </div>
                                )}

                                {/* Message */}
                                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-end space-x-1 sm:space-x-2 max-w-[280px] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {!isOwnMessage && showAvatar && (
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={message.sender.avatarUrl}
                                                    alt={message.sender.name}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        )}
                                        {!isOwnMessage && !showAvatar && (
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                                        )}
                                        <div
                                            className={`px-3 sm:px-4 py-2 flex flex-col items-start space-y-1 shadow-lg rounded-[10px] ${isOwnMessage
                                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white'
                                                : 'bg-black text-white'
                                                }`}
                                        >
                                            <p className="text-xs sm:text-sm break-words">{message.content || message.message}</p>
                                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {(typingUsers.length > 0 || aiTyping) && (
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden">
                                <Image
                                    src={aiTyping ? '/chatbot.png' : otherParticipant?.avatarUrl}
                                    alt={aiTyping ? 'Your AI Friend' : otherParticipant?.name}
                                    width={32}
                                    height={32}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="bg-neutral-100 dark:bg-neutral-700 px-3 sm:px-4 py-2 rounded-lg">
                                <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                <div className="flex items-center space-x-2">
                    <Input
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={isChatbot ? "Ask me anything..." : `Message ${otherParticipant?.name}...`}
                        className="py-2 text-sm sm:text-base outline-none border-none shadow-md hover:shadow-lg transition-shadow duration-300 focus:!shadow-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                        className="h-9 w-9 sm:h-10 sm:w-10 p-2"
                    >
                        <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
