'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const userDetails = useSelector((state) => state.user.user);

    useEffect(() => {
        if (userDetails) {
            // Initialize socket connection
            const newSocket = io('http://localhost:5000', {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Connected to server');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [userDetails]);

    const joinChat = (chatId) => {
        if (socket) {
            socket.emit('join-chat', chatId);
        }
    };

    const sendMessage = (messageData) => {
        if (socket) {
            socket.emit('send-message', messageData);
        }
    };

    const emitTyping = (chatId) => {
        if (socket && userDetails) {
            socket.emit('typing', {
                chatId,
                userId: userDetails._id,
                username: userDetails.username
            });
        }
    };

    const emitStopTyping = (chatId) => {
        if (socket && userDetails) {
            socket.emit('stop-typing', {
                chatId,
                userId: userDetails._id
            });
        }
    };

    const value = {
        socket,
        isConnected,
        joinChat,
        sendMessage,
        emitTyping,
        emitStopTyping
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
