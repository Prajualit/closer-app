"use client"
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from '@/lib/SocketContext';
import { 
  addNewNotification, 
  incrementUnreadCount,
  fetchUnreadCount 
} from '@/redux/slice/notificationSlice';

/**
 * Custom hook for handling real-time notification updates with Socket.io
 */
export const useNotificationUpdates = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!user || !socket || !isConnected) return;

    // Socket.io handles real-time notifications automatically via SocketContext
    // This hook can be used for additional notification-specific logic
    
    // Fetch initial unread count when connected
    dispatch(fetchUnreadCount());

    // Optional: Set up periodic sync as fallback (every 5 minutes)
    const syncInterval = setInterval(() => {
      if (isConnected) {
        dispatch(fetchUnreadCount());
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(syncInterval);
    };
  }, [dispatch, user, socket, isConnected]);

  // Function to manually add a notification (useful for testing)
  const addNotification = (notification) => {
    dispatch(addNewNotification(notification));
  };

  // Function to manually increment unread count
  const incrementUnread = () => {
    dispatch(incrementUnreadCount());
  };

  return {
    addNotification,
    incrementUnread,
  };
};

/**
 * Simulate receiving a new notification (for testing purposes)
 */
export const simulateNotification = (type = 'follow') => {
  const mockNotifications = {
    follow: {
      _id: `mock-${Date.now()}`,
      sender: {
        _id: 'mock-sender',
        username: 'johndoe',
        name: 'John Doe',
        avatarUrl: null,
      },
      type: 'follow',
      message: 'John Doe (@johndoe) started following you',
      read: false,
      createdAt: new Date().toISOString(),
      data: {},
    },
    message: {
      _id: `mock-${Date.now()}`,
      sender: {
        _id: 'mock-sender-2',
        username: 'janedoe',
        name: 'Jane Doe',
        avatarUrl: null,
      },
      type: 'message',
      message: 'Jane Doe (@janedoe) sent you a message',
      read: false,
      createdAt: new Date().toISOString(),
      data: {
        messageId: 'mock-message-id',
        chatId: 'mock-chat-id',
      },
    },
  };

  return mockNotifications[type] || mockNotifications.follow;
};
