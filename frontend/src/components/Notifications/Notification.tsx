import React from 'react';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { markNotificationAsRead, deleteNotification } from '@/redux/slice/notificationSlice';
import { useSocket } from '@/lib/SocketContext';
import Link from 'next/link';

interface NotificationSender {
  _id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface NotificationData {
  postId?: string;
  chatId?: string | { chatId: string };
}

interface NotificationProps {
  notification: {
    _id: string;
    type: 'follow' | 'like' | 'comment' | 'message' | string;
    sender: NotificationSender;
    data?: NotificationData;
    message: string;
    createdAt: string;
    read: boolean;
  };
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  const dispatch = useDispatch();

  const handleMarkAsRead = (): void => {
    if (!notification.read) {
      dispatch<any>(markNotificationAsRead(notification._id));
    }
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dispatch<any>(deleteNotification(notification._id));
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'follow':
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'like':
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationLink = () => {
    switch (notification.type) {
      case 'follow':
        return `/profile/${notification.sender._id}`;
      case 'like':
        // Navigate to the post that was liked
        if (notification.data?.postId) {
          return `/${notification.sender.username}/home?postId=${notification.data.postId}`;
        }
        return `/profile/${notification.sender._id}`;
      case 'comment':
        // Navigate to the post that was commented on
        if (notification.data?.postId) {
          return `/${notification.sender.username}/home?postId=${notification.data.postId}`;
        }
        return `/profile/${notification.sender._id}`;
      case 'message':
        // If we have a chatId, navigate directly to that specific chat
        if (notification.data?.chatId) {
          // Handle both populated and non-populated chatId
          const chatIdValue = typeof notification.data.chatId === 'object' 
            ? notification.data.chatId.chatId 
            : notification.data.chatId;
          return `/${notification.sender.username}/chat?chatId=${chatIdValue}`;
        }
        // Fallback to general chat page with userId for creating/finding chat
        return `/${notification.sender.username}/chat?userId=${notification.sender._id}&username=${notification.sender.username}`;
      default:
        return '#';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <Link href={getNotificationLink()}>
      <div
        className={`group flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors ${
          !notification.read ? 'bg-blue-50 dark:bg-neutral-600/20 border-l-4 border-l-blue-500 dark:border-l-white' : ''
        }`}
        onClick={handleMarkAsRead}
      >
        {/* Sender Avatar */}
        <div className="flex-shrink-0">
          {notification.sender.avatarUrl ? (
            <Image
              src={notification.sender.avatarUrl}
              alt={notification.sender.name}
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs sm:text-sm">
                {notification.sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <p className="text-xs sm:text-sm text-neutral-900 dark:text-white leading-5 break-words">
                {notification.message}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {timeAgo}
              </p>
            </div>
            
            {/* Notification Type Icon */}
            <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-3 flex-shrink-0">
              {getNotificationIcon()}
              
              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete notification"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400 dark:text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 dark:bg-white rounded-full"></div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Notification;
