import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Message, ChatRoom } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { notifyMessage } from "./notification.controller.js";

// Get or create a chat room between two users
const getOrCreateChatRoom = asyncHandler(async (req, res) => {
    const { participantId } = req.params;
    const currentUserId = req.user._id;

    if (!participantId) {
        throw new ApiError(400, "Participant ID is required");
    }

    // Create a consistent chatId for both users
    const chatId = [currentUserId, participantId].sort().join('-');

    let chatRoom = await ChatRoom.findOne({ chatId })
        .populate('participants', 'username name avatarUrl')
        .populate('lastMessage');

    if (!chatRoom) {
        // Verify that the participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            throw new ApiError(404, "User not found");
        }

        chatRoom = await ChatRoom.create({
            chatId,
            participants: [currentUserId, participantId]
        });

        chatRoom = await ChatRoom.findById(chatRoom._id)
            .populate('participants', 'username name avatarUrl')
            .populate('lastMessage');
    }

    return res.status(200).json(
        new ApiResponse(200, chatRoom, "Chat room retrieved successfully")
    );
});

// Get chat messages with pagination
const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }

    // Verify user is part of this chat
    const chatRoom = await ChatRoom.findOne({ 
        chatId,
        participants: req.user._id 
    });

    if (!chatRoom) {
        throw new ApiError(403, "Access denied to this chat");
    }

    const messages = await Message.find({ chatId })
        .populate('sender', 'username name avatarUrl')
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const totalMessages = await Message.countDocuments({ chatId });

    return res.status(200).json(
        new ApiResponse(200, {
            messages: messages.reverse(), // Reverse to show oldest first
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                hasNextPage: page * limit < totalMessages,
                hasPrevPage: page > 1
            }
        }, "Messages retrieved successfully")
    );
});

// Save a message to database
const saveMessage = asyncHandler(async (req, res) => {
    const { chatId, content } = req.body;
    const senderId = req.user._id;

    if (!chatId || !content) {
        throw new ApiError(400, "Chat ID and content are required");
    }

    // Verify user is part of this chat
    const chatRoom = await ChatRoom.findOne({ 
        chatId,
        participants: senderId 
    });

    if (!chatRoom) {
        throw new ApiError(403, "Access denied to this chat");
    }

    const message = await Message.create({
        content,
        sender: senderId,
        chatId
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username name avatarUrl');

    // Update chat room's last message and activity
    await ChatRoom.findByIdAndUpdate(chatRoom._id, {
        lastMessage: message._id,
        lastActivity: new Date()
    });

    // Create message notification for the recipient
    try {
        const recipient = chatRoom.participants.find(p => p.toString() !== senderId.toString());
        if (recipient) {
            await notifyMessage(senderId, recipient, message._id, chatRoom._id);
        }
    } catch (error) {
        console.error("Failed to create message notification:", error);
        // Don't fail the message operation if notification fails
    }

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Message saved successfully")
    );
});

// Get user's chat rooms
const getUserChatRooms = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const chatRooms = await ChatRoom.find({
        participants: userId
    })
    .populate('participants', 'username name avatarUrl')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    // Calculate unread counts for each chat room
    const chatRoomsWithUnreadCounts = await Promise.all(
        chatRooms.map(async (chatRoom) => {
            if (chatRoom.isChatbot) {
                // For chatbot rooms, don't calculate unread counts - AI responses don't need notifications
                return {
                    ...chatRoom.toObject(),
                    unreadCount: 0, // Always 0 for AI chats
                    isChatbot: true,
                    participants: [{
                        _id: 'ai-assistant',
                        name: 'Your AI Friend',
                        avatarUrl: '/chatbot.png'
                    }]
                };
            } else {
                // For regular chats
                const unreadCount = await Message.countDocuments({
                    chatId: chatRoom.chatId,
                    sender: { $ne: userId }, // Messages not sent by current user
                    $or: [
                        { readBy: { $exists: false } }, // No readBy field
                        { readBy: { $not: { $elemMatch: { user: userId } } } } // User hasn't read
                    ]
                });

                return {
                    ...chatRoom.toObject(),
                    unreadCount
                };
            }
        })
    );

    return res.status(200).json(
        new ApiResponse(200, chatRoomsWithUnreadCounts, "Chat rooms retrieved successfully")
    );
});

// Mark messages as read
const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;

    if (!chatId) {
        throw new ApiError(400, "Chat ID is required");
    }

    // Verify user is part of this chat
    const chatRoom = await ChatRoom.findOne({ 
        chatId,
        participants: userId 
    });

    if (!chatRoom) {
        throw new ApiError(403, "Access denied to this chat");
    }

    // Mark all unread messages as read
    await Message.updateMany(
        {
            chatId,
            sender: { $ne: userId }, // Messages not sent by current user
            $or: [
                { readBy: { $exists: false } }, // No readBy field
                { readBy: { $not: { $elemMatch: { user: userId } } } } // User hasn't read
            ]
        },
        {
            $push: {
                readBy: {
                    user: userId,
                    readAt: new Date()
                }
            }
        }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Messages marked as read")
    );
});

export {
    getOrCreateChatRoom,
    getChatMessages,
    saveMessage,
    getUserChatRooms,
    markMessagesAsRead
};
