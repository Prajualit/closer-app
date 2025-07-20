

import { Server, Socket } from 'socket.io';
// @ts-ignore
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import type { Server as HTTPServer } from 'http';

/**
 * Extend Socket.IO Socket to include user and userId properties
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any; // Use 'any' since no IUser type is exported
}

let io: Server | undefined;



// Initialize Socket.IO server
export const initializeSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    } as any, // workaround for type error in ServerOptions
  } as any); // workaround for type error in ServerOptions

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // @ts-ignore: handshake is present on socket
      const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { _id: string };
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

  // @ts-ignore: .on is present at runtime
  io.on('connection', (socket: AuthenticatedSocket) => {
    // @ts-ignore: id, join, broadcast, on, to are present on socket
    console.log(`User ${socket.user?.username} connected: ${socket.id}`);
    // Join user to their personal room for notifications
    // @ts-ignore
    socket.join(`user_${socket.userId}`);

    // Handle user going online
    // @ts-ignore
    socket.on('user_online', () => {
      // @ts-ignore
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'online'
      });
    });

    // Handle disconnection
    // @ts-ignore
    socket.on('disconnect', () => {
      // @ts-ignore
      console.log(`User ${socket.user?.username} disconnected: ${socket.id}`);
      // Notify others that user went offline
      // @ts-ignore
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'offline'
      });
    });

    // Handle marking notifications as read in real-time
    // @ts-ignore
    socket.on('notification_read', (notificationId: string) => {
      // Broadcast to user's other devices/tabs
      // @ts-ignore
      socket.to(`user_${socket.userId}`).emit('notification_marked_read', notificationId);
    });

    // Handle marking all notifications as read
    // @ts-ignore
    socket.on('notifications_all_read', () => {
      // @ts-ignore
      socket.to(`user_${socket.userId}`).emit('notifications_all_marked_read');
    });
  });

  return io;
};


// Get Socket.IO instance
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};


// Send notification to a specific user
export const sendNotificationToUser = (userId: string, notification: any) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot send real-time notification');
    return;
  }
  io.to(`user_${userId}`).emit('new_notification', notification);
};

// Send unread count update to a user
export const sendUnreadCountUpdate = (userId: string, unreadCount: number) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot send unread count update');
    return;
  }
  io.to(`user_${userId}`).emit('unread_count_update', { unreadCount });
};

// Broadcast user status update
export const broadcastUserStatus = (userId: string, status: string) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot broadcast user status');
    return;
  }
  // @ts-ignore: .emit is present at runtime
  io.emit('user_status', { userId, status });
};
