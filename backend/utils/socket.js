import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

let io;

// Initialize Socket.IO server
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
      
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);
    
    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);
    
    // Handle user going online
    socket.on('user_online', () => {
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'online'
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected: ${socket.id}`);
      
      // Notify others that user went offline
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'offline'
      });
    });

    // Handle marking notifications as read in real-time
    socket.on('notification_read', (notificationId) => {
      // Broadcast to user's other devices/tabs
      socket.to(`user_${socket.userId}`).emit('notification_marked_read', notificationId);
    });

    // Handle marking all notifications as read
    socket.on('notifications_all_read', () => {
      socket.to(`user_${socket.userId}`).emit('notifications_all_marked_read');
    });
  });

  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Send notification to a specific user
export const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot send real-time notification');
    return;
  }

  io.to(`user_${userId}`).emit('new_notification', notification);
};

// Send unread count update to a user
export const sendUnreadCountUpdate = (userId, unreadCount) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot send unread count update');
    return;
  }

  io.to(`user_${userId}`).emit('unread_count_update', { unreadCount });
};

// Broadcast user status update
export const broadcastUserStatus = (userId, status) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot broadcast user status');
    return;
  }

  io.emit('user_status', { userId, status });
};
