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
        required: true
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
    }
}, {
    timestamps: true
});

export const Message = mongoose.model("Message", messageSchema);
export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
