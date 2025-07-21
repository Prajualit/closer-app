'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addNewNotification, 
  markNotificationAsRead as markAsReadInStore,
  markAllNotificationsAsRead as markAllAsReadInStore,
  fetchUnreadCount 
} from '@/redux/slice/notificationSlice';

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  sendMessage: (messageData: any) => void;
  emitTyping: (chatId: string) => void;
  emitStopTyping: (chatId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

// import type { ReactNode } from 'react';
import { RootState } from '@/redux/Store';

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const userDetails = useSelector((state: RootState) => {
        const user = state.user.user;
        if (typeof user === 'string') return null;
        return user as {
            _id: string;
            username: string;
            accessToken?: string;
            [key: string]: any;
        } | null;
    });
    const dispatch = useDispatch();

    useEffect(() => {
        let newSocket: ReturnType<typeof io> | null = null;

        if (userDetails && userDetails.accessToken) {
            newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
                auth: {
                    token: userDetails.accessToken,
                },
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                setIsConnected(true);
                newSocket?.emit('user_online');
            });
            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });
            newSocket.on('connect_error', (error: any) => {
                setIsConnected(false);
            });
            newSocket.on('new_notification', (notification: any) => {
                dispatch(addNewNotification(notification));
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(notification.message, {
                        icon: notification.sender.avatarUrl || '/favicon.ico',
                        badge: '/favicon.ico',
                        tag: notification._id,
                    });
                }
            });
            newSocket.on('unread_count_update', ({ unreadCount }: { unreadCount: number }) => {
                (dispatch as any)(fetchUnreadCount());
            });
            newSocket.on('notification_marked_read', (notificationId: string) => {
                (dispatch as any)(markAsReadInStore(notificationId));
            });
            newSocket.on('notifications_all_marked_read', () => {
                (dispatch as any)(markAllAsReadInStore());
            });
            newSocket.on('user_status', ({ userId, status }: { userId: string; status: string }) => {
                // Optionally handle user status
            });
            setSocket(newSocket);
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [userDetails?.accessToken, dispatch, socket, userDetails]);

    // Request notification permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                console.log('Notification permission:', permission);
            });
        }
    }, []);

    const joinChat = (chatId: string) => {
        if (socket) {
            (socket as ReturnType<typeof io>).emit('join-chat', chatId);
        }
    };

    const sendMessage = (messageData: any) => {
        if (socket) {
            (socket as ReturnType<typeof io>).emit('send-message', messageData);
        }
    };

    const emitTyping = (chatId: string) => {
        if (socket && userDetails) {
            (socket as ReturnType<typeof io>).emit('typing', {
                chatId,
                userId: userDetails._id,
                username: userDetails.username
            });
        }
    };

    const emitStopTyping = (chatId: string) => {
        if (socket && userDetails) {
            (socket as ReturnType<typeof io>).emit('stop-typing', {
                chatId,
                userId: userDetails._id
            });
        }
    };

    const markNotificationAsRead = (notificationId: string) => {
        if (socket) {
            (socket as ReturnType<typeof io>).emit('notification_read', notificationId);
        }
    };

    const markAllNotificationsAsRead = () => {
        if (socket) {
            (socket as ReturnType<typeof io>).emit('notifications_all_read');
        }
    };

    const value: SocketContextType = {
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
