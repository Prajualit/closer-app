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
// Types for Redux state
interface UserState {
  user: {
    username?: string;
    [key: string]: any;
  };
}

interface RootState {
  user: UserState;
  [key: string]: any;
}

export interface Notification {
  _id: string;
  sender: {
    _id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  data: Record<string, any>;
}

export const useNotificationUpdates = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!user || !socket || !isConnected) return;

    // Socket.io handles real-time notifications automatically via SocketContext
    // This hook can be used for additional notification-specific logic

    // Fetch initial unread count when connected
    dispatch<any>(fetchUnreadCount());

    // Optional: Set up periodic sync as fallback (every 5 minutes)
    const syncInterval = setInterval(() => {
      if (isConnected) {
        dispatch<any>(fetchUnreadCount());
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(syncInterval);
    };
  }, [dispatch, user, socket, isConnected]);

  // Function to manually add a notification (useful for testing)
  const addNotification = (notification: Notification) => {
    dispatch<any>(addNewNotification(notification));
  };

  // Function to manually increment unread count
  const incrementUnread = () => {
    dispatch<any>(incrementUnreadCount());
  };

  return {
    addNotification,
    incrementUnread,
  };
};

/**
 * Simulate receiving a new notification (for testing purposes)
 */
export const simulateNotification = (type: string = 'follow'): Notification => {
  const mockNotifications: Record<string, Notification> = {
    follow: {
      _id: `mock-${Date.now()}`,
      sender: {
        _id: 'mock-sender',
        username: 'johndoe',
        name: 'John Doe',
        avatarUrl: undefined,
      },
      type: 'follow',
      message: 'John Doe (@johndoe) started following you',
      read: false,
      createdAt: new Date().toISOString(),
      data: {},
    },
    like: {
      _id: `mock-like-${Date.now()}`,
      sender: {
        _id: 'mock-sender-3',
        username: 'alexsmith',
        name: 'Alex Smith',
        avatarUrl: undefined,
      },
      type: 'like',
      message: 'Alex Smith (@alexsmith) liked your post',
      read: false,
      createdAt: new Date().toISOString(),
      data: {
        postId: 'mock-post-id',
      },
    },
    comment: {
      _id: `mock-comment-${Date.now()}`,
      sender: {
        _id: 'mock-sender-4',
        username: 'sarahwilson',
        name: 'Sarah Wilson',
        avatarUrl: undefined,
      },
      type: 'comment',
      message: 'Sarah Wilson (@sarahwilson) commented on your post',
      read: false,
      createdAt: new Date().toISOString(),
      data: {
        postId: 'mock-post-id',
        commentId: 'mock-comment-id',
      },
    },
    message: {
      _id: `mock-${Date.now()}`,
      sender: {
        _id: 'mock-sender-2',
        username: 'janedoe',
        name: 'Jane Doe',
        avatarUrl: undefined,
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
