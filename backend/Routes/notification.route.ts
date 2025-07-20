// @ts-ignore
import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notification.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJwt);

// Get notifications for the current user
router.route("/").get(getNotifications);

// Get unread notification count
router.route("/unread-count").get(getUnreadCount);

// Mark all notifications as read
router.route("/mark-all-read").patch(markAllAsRead);

// Mark specific notification as read
router.route("/:notificationId/read").patch(markAsRead);

// Delete a notification
router.route("/:notificationId").delete(deleteNotification);

export default router;
