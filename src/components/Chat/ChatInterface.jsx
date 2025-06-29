'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/lib/SocketContext';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChatInterface = ({ chatRoom, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const { socket, joinChat, sendMessage, emitTyping, emitStopTyping } = useSocket();
    const userDetails = useSelector((state) => state.user.user);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { toast } = useToast();

    // Get the other participant
    const otherParticipant = chatRoom?.participants?.find(p => p._id !== userDetails?._id);

    useEffect(() => {
        if (chatRoom?.chatId) {
            joinChat(chatRoom.chatId);
            fetchMessages();
        }
    }, [chatRoom]);

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
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/v1/chat/messages/${chatRoom.chatId}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
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

    const handleReceiveMessage = (messageData) => {
        setMessages(prev => [...prev, messageData]);
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

        const messageData = {
            chatId: chatRoom.chatId,
            message: newMessage.trim(),
            sender: {
                _id: userDetails._id,
                username: userDetails.username,
                name: userDetails.name,
                avatarUrl: userDetails.avatarUrl
            },
            timestamp: new Date().toISOString()
        };

        // Send via socket
        sendMessage(messageData);

        // Save to database
        try {
            await fetch('http://localhost:5000/api/v1/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatId: chatRoom.chatId,
                    content: newMessage.trim()
                })
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }

        setNewMessage('');
        handleStopTyping();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading messages...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="md:hidden"
                    >
                        ←
                    </Button>
                    {otherParticipant && (
                        <>
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <Image
                                    src={otherParticipant.avatarUrl}
                                    alt={otherParticipant.name}
                                    width={40}
                                    height={40}
                                    className="object-cover bg-center rounded-full"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">{otherParticipant.name}</h3>
                                <p className="text-sm text-gray-500">@{otherParticipant.username}</p>
                            </div>
                        </>
                    )}
                </div>
                <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-[#eeeeee] ">
                <div className="space-y-4">
                    {messages.map((message, index) => {
                        const isOwnMessage = message.sender._id === userDetails?._id;
                        const showAvatar = index === 0 ||
                            messages[index - 1].sender._id !== message.sender._id;

                        return (
                            <div
                                key={message._id || index}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    {!isOwnMessage && showAvatar && (
                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                            <Image
                                                src={message.sender.avatarUrl}
                                                alt={message.sender.name}
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    {!isOwnMessage && !showAvatar && (
                                        <div className="w-8 h-8" />
                                    )}
                                    <div
                                        className={`px-4 py-2 flex space-x-3 shadow-lg rounded-[10px] ${isOwnMessage
                                                ? 'bg-white text-black'
                                                : 'bg-black text-white'
                                            }`}
                                    >
                                        <p className="text-sm">{message.content || message.message}</p>
                                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {formatTime(message.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                    src={otherParticipant?.avatarUrl}
                                    alt={otherParticipant?.name}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                />
                            </div>
                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                    <Input
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${otherParticipant?.name}...`}
                        className="py-2 outline-none border-none shadow-md hover:shadow-lg transition-shadow duration-300 focus:!shadow-lg bg-white"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
