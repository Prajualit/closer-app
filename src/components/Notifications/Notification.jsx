import React from 'react';
import { useDispatch } from 'react-redux';
import { markNotificationAsRead, deleteNotification } from '@/redux/slice/notificationSlice';
import { useSocket } from '@/lib/SocketContext';
import Link from 'next/link';

const Notification = ({ notification }) => {
  const dispatch = useDispatch();

  const handleMarkAsRead = () => {
    if (!notification.read) {
      dispatch(markNotificationAsRead(notification._id));
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(deleteNotification(notification._id));
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'follow':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
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
        className={`group flex items-start space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={handleMarkAsRead}
      >
        {/* Sender Avatar */}
        <div className="flex-shrink-0">
          {notification.sender.avatarUrl ? (
            <img
              src={notification.sender.avatarUrl}
              alt={notification.sender.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {notification.sender.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-900 leading-5">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {timeAgo}
              </p>
            </div>
            
            {/* Notification Type Icon */}
            <div className="flex items-center space-x-2 ml-3">
              {getNotificationIcon()}
              
              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete notification"
              >
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Notification;
