'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addNewNotification, 
  markNotificationAsRead as markAsReadInStore,
  markAllNotificationsAsRead as markAllAsReadInStore,
  fetchUnreadCount 
} from '@/redux/slice/notificationSlice';

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
    const dispatch = useDispatch();

    useEffect(() => {
        let newSocket = null;

        if (userDetails?.accessToken) {
            // Initialize socket connection with authentication
            newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
                auth: {
                    token: userDetails.accessToken,
                },
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            // Connection event handlers
            newSocket.on('connect', () => {
                console.log('Connected to server');
                setIsConnected(true);
                newSocket.emit('user_online');
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                setIsConnected(false);
            });

            // Notification event handlers
            newSocket.on('new_notification', (notification) => {
                console.log('New notification received:', notification);
                dispatch(addNewNotification(notification));
                
                // Show browser notification if permission granted
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(notification.message, {
                        icon: notification.sender.avatarUrl || '/favicon.ico',
                        badge: '/favicon.ico',
                        tag: notification._id,
                    });
                }
            });

            newSocket.on('unread_count_update', ({ unreadCount }) => {
                console.log('Unread count updated:', unreadCount);
                dispatch(fetchUnreadCount());
            });

            newSocket.on('notification_marked_read', (notificationId) => {
                dispatch(markAsReadInStore(notificationId));
            });

            newSocket.on('notifications_all_marked_read', () => {
                dispatch(markAllAsReadInStore());
            });

            newSocket.on('user_status', ({ userId, status }) => {
                console.log(`User ${userId} is now ${status}`);
            });

            setSocket(newSocket);
        } else {
            // No user, disconnect if socket exists
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }

        // Cleanup
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userDetails?.accessToken]); // Intentionally limited dependencies

    // Request notification permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                console.log('Notification permission:', permission);
            });
        }
    }, []);

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

    const markNotificationAsRead = (notificationId) => {
        if (socket) {
            socket.emit('notification_read', notificationId);
        }
    };

    const markAllNotificationsAsRead = () => {
        if (socket) {
            socket.emit('notifications_all_read');
        }
    };

    const value = {
        socket,
        isConnected,
        joinChat,
        sendMessage,
        emitTyping,
        emitStopTyping,
        markNotificationAsRead,
        markAllNotificationsAsRead
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
