import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Message, ChatRoom } from "../models/chat.model.js";
import { User } from "../models/user.model.js";

// Get or create a chat room between two users
const getOrCreateChatRoom = asyncHandler(async (req, res) => {
    const { participantId } = req.params;
    const currentUserId = req.user._id;

    if (!participantId) {
        throw new apiError(400, "Participant ID is required");
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
            throw new apiError(404, "User not found");
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
        new apiResponse(200, chatRoom, "Chat room retrieved successfully")
    );
});

// Get chat messages with pagination
const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!chatId) {
        throw new apiError(400, "Chat ID is required");
    }

    // Verify user is part of this chat
    const chatRoom = await ChatRoom.findOne({ 
        chatId,
        participants: req.user._id 
    });

    if (!chatRoom) {
        throw new apiError(403, "Access denied to this chat");
    }

    const messages = await Message.find({ chatId })
        .populate('sender', 'username name avatarUrl')
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const totalMessages = await Message.countDocuments({ chatId });

    return res.status(200).json(
        new apiResponse(200, {
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
        throw new apiError(400, "Chat ID and content are required");
    }

    // Verify user is part of this chat
    const chatRoom = await ChatRoom.findOne({ 
        chatId,
        participants: senderId 
    });

    if (!chatRoom) {
        throw new apiError(403, "Access denied to this chat");
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

    return res.status(201).json(
        new apiResponse(201, populatedMessage, "Message saved successfully")
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

    return res.status(200).json(
        new apiResponse(200, chatRooms, "Chat rooms retrieved successfully")
    );
});

export {
    getOrCreateChatRoom,
    getChatMessages,
    saveMessage,
    getUserChatRooms
};
