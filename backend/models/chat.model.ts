import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiSenderInfo {
  name?: string;
  avatarUrl?: string;
  id?: string;
}

export interface IReadBy {
  user: mongoose.Types.ObjectId;
  readAt?: Date;
}

export interface IMessage extends Document {
  content: string;
  sender?: mongoose.Types.ObjectId;
  isAiMessage: boolean;
  aiSenderInfo?: IAiSenderInfo;
  chatId: string;
  timestamp?: Date;
  edited?: boolean;
  editedAt?: Date;
  readBy?: IReadBy[];
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: function(this: IMessage) {
      return !this.isAiMessage;
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

export interface IChatRoom extends Document {
  chatId: string;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity?: Date;
  isChatbot?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatRoomSchema = new Schema<IChatRoom>({
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

export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);
export const ChatRoom: Model<IChatRoom> = mongoose.model<IChatRoom>("ChatRoom", chatRoomSchema);
