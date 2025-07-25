
import { Request, Response } from "express";

// Express Request is globally extended to include user
import { User } from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { ChatRoom, Message } from "../models/chat.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNotificationToUser, sendUnreadCountUpdate } from "../utils/socket.js";

// Get all notifications for a user
const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Parse query params safely
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const userId = req.user._id;

    const filter: any = { recipient: userId };
    if (unreadOnly) {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'username name avatarUrl')
      .populate({
        path: 'data.messageId',
        model: 'Message',
        select: 'content timestamp'
      })
      .populate({
        path: 'data.chatId',
        model: 'ChatRoom',
        select: 'chatId participants'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    return res.status(200).json(
      new ApiResponse(200, {
        notifications: notifications || [],
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          unreadCount,
        }
      }, "Notifications retrieved successfully")
    );
  } catch (error: unknown) {
    console.error('Error in getNotifications:', error);
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    throw new ApiError(500, `Failed to fetch notifications: ${message}`);
  }
});

// Mark notification as read
const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  // Send real-time update for unread count
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });
  
  try {
    sendUnreadCountUpdate(userId.toString(), unreadCount);
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    console.warn('Failed to send real-time unread count update:', message);
  }

  return res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );

  // Send real-time update for unread count (should be 0 now)
  try {
    sendUnreadCountUpdate(userId.toString(), 0);
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    console.warn('Failed to send real-time unread count update:', message);
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "All notifications marked as read")
  );
});

// Delete a notification
const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Notification deleted successfully")
  );
});

// Create a notification (internal use)
const createNotification = async (
  recipientId: string,
  senderId: string,
  type: string,
  message: string,
  data: Record<string, any> = {}
): Promise<any> => {
  try {
    // Don't send notification to self
    if (recipientId.toString() === senderId.toString()) {
      return null;
    }

    // Check if a similar notification already exists (prevent spam)
    const existingNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      read: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    });

    if (existingNotification && (type === 'follow' || type === 'like')) {
      return existingNotification;
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      data,
    });

    await notification.save();
    
    // Populate the notification with sender details for real-time emission
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'username name avatarUrl');

    // Send real-time notification
    try {
      sendNotificationToUser(recipientId.toString(), populatedNotification);
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      console.warn('Failed to send real-time notification:', message);
    }

    // Send updated unread count
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        read: false,
      });
      sendUnreadCountUpdate(recipientId.toString(), unreadCount);
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      console.warn('Failed to send real-time unread count update:', message);
    }

    return populatedNotification;
  } catch (error: unknown) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Get unread count
const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json(
      new ApiResponse(200, { unreadCount: unreadCount || 0 }, "Unread count retrieved successfully")
    );
  } catch (error: unknown) {
    console.error('Error in getUnreadCount:', error);
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    throw new ApiError(500, `Failed to fetch unread count: ${message}`);
  }
});

// Helper functions for creating specific types of notifications
const notifyFollow = async (followerId: string, followedUserId: string): Promise<any> => {
  const follower = await User.findById(followerId).select('username name');
  if (!follower) return null;

  return createNotification(
    followedUserId,
    followerId,
    'follow',
    `${follower.name} (@${follower.username}) started following you`,
    {}
  );
};

const notifyLike = async (likerId: string, postOwnerId: string, postId: string): Promise<any> => {
  const liker = await User.findById(likerId).select('username name');
  if (!liker) return null;

  return createNotification(
    postOwnerId,
    likerId,
    'like',
    `${liker.name} (@${liker.username}) liked your post`,
    { postId }
  );
};

const notifyComment = async (
  commenterId: string,
  postOwnerId: string,
  postId: string,
  commentId: string
): Promise<any> => {
  const commenter = await User.findById(commenterId).select('username name');
  if (!commenter) return null;

  return createNotification(
    postOwnerId,
    commenterId,
    'comment',
    `${commenter.name} (@${commenter.username}) commented on your post`,
    { postId, commentId }
  );
};

const notifyMessage = async (
  senderId: string,
  recipientId: string,
  messageId: string,
  chatId: string
): Promise<any> => {
  const sender = await User.findById(senderId).select('username name');
  if (!sender) return null;

  return createNotification(
    recipientId,
    senderId,
    'message',
    `${sender.name} (@${sender.username}) sent you a message`,
    { messageId, chatId }
  );
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount,
  notifyFollow,
  notifyLike,
  notifyComment,
  notifyMessage,
};
