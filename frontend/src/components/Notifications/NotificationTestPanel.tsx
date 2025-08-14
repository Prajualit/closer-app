"use client"
import React from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from '@/lib/SocketContext';
import { addNewNotification } from '@/redux/slice/notificationSlice';
import { simulateNotification } from '@/hooks/useNotificationUpdates';

const NotificationTestPanel = () => {
  const dispatch = useDispatch();
  const { socket, isConnected } = useSocket();

  const handleSimulateFollow = () => {
    const notification = simulateNotification('follow');
    dispatch(addNewNotification(notification));
  };

  const handleSimulateLike = () => {
    const notification = simulateNotification('like');
    dispatch(addNewNotification(notification));
  };

  const handleSimulateComment = () => {
    const notification = simulateNotification('comment');
    dispatch(addNewNotification(notification));
  };

  const handleSimulateMessage = () => {
    const notification = simulateNotification('message');
    dispatch(addNewNotification(notification));
  };

  const handleTestConnection = () => {
    if (socket) {
      socket.emit('user_online');
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <h3 className="text-sm font-medium text-neutral-900 mb-3">Test Notifications</h3>
      
      {/* Connection Status */}
      <div className="mb-3 p-2 rounded bg-neutral-50">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs">
            Socket.io: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleSimulateFollow}
          className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Simulate Follow
        </button>
        <button
          onClick={handleSimulateLike}
          className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Simulate Like
        </button>
        <button
          onClick={handleSimulateComment}
          className="w-full px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
        >
          Simulate Comment
        </button>
        <button
          onClick={handleSimulateMessage}
          className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Simulate Message
        </button>
        <button
          onClick={handleTestConnection}
          disabled={!socket}
          className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
        >
          Test Connection
        </button>
      </div>
    </div>
  );
};

export default NotificationTestPanel;
