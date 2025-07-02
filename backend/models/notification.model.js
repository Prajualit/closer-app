import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['follow', 'message', 'like', 'comment', 'mention'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
      postId: { type: String },
      chatId: { type: Schema.Types.ObjectId, ref: 'ChatRoom' },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Automatically set readAt when read is set to true
notificationSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  if (update.read === true && !update.readAt) {
    update.readAt = new Date();
  }
});

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
