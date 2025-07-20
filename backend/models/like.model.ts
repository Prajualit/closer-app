import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    mediaId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one like per user per post
likeSchema.index({ userId: 1, postId: 1, mediaId: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);
