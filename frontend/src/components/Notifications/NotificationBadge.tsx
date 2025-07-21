
import React, { useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from '@/lib/SocketContext';
import { fetchUnreadCount } from '@/redux/slice/notificationSlice';
import type { RootState } from '@/redux/Store';

interface NotificationBadgeProps {
  children: ReactNode;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ children, className = '' }) => {
  const dispatch = useDispatch();
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);
  const user = useSelector((state: RootState) => state.user.user);
  const { isConnected } = useSocket();

  useEffect(() => {
    // Fetch unread count when component mounts and user is authenticated
    if (user) {
      dispatch<any>(fetchUnreadCount());

      // Only set up fallback polling if not connected to socket
      if (!isConnected) {
        const interval = setInterval(() => {
          dispatch<any>(fetchUnreadCount());
        }, 30000); // 30 seconds fallback polling

        return () => clearInterval(interval);
      }
    }
  }, [dispatch, user, isConnected]);

  return (
    <div className={`relative ${className}`}>
      {children}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;
