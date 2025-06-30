import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getOrCreateChatRoom,
    getChatMessages,
    saveMessage,
    getUserChatRooms
} from "../controllers/chat.controller.js";

const router = Router();

// All chat routes require authentication
router.use(verifyJWT);

// Get user's chat rooms
router.route("/rooms").get(getUserChatRooms);

// Get or create a chat room with another user
router.route("/room/:participantId").get(getOrCreateChatRoom);

// Get messages from a specific chat
router.route("/messages/:chatId").get(getChatMessages);

// Save a message
router.route("/message").post(saveMessage);

export default router;
