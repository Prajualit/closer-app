import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: function() {
            return !this.isAiMessage; // sender is only required if it's not an AI message
        }
    },
    isAiMessage: {
        type: Boolean,
        default: false
    },
    aiSenderInfo: {
        name: {
            type: String,
            default: 'Your AI Friend'
        },
        avatarUrl: {
            type: String,
            default: '/chatbot.png'
        },
        id: {
            type: String,
            default: 'ai-assistant'
        }
    },
    chatId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    readBy: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const chatRoomSchema = new Schema({
    chatId: {
        type: String,
        required: true,
        unique: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message"
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    isChatbot: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Message = mongoose.model("Message", messageSchema);
export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
