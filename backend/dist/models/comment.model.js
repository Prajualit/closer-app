import mongoose, { Schema } from "mongoose";
const commentSchema = new Schema({
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
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true,
});
export const Comment = mongoose.model("Comment", commentSchema);
