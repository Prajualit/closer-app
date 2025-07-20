import mongoose, { Schema } from "mongoose";
// @ts-ignore
import jwt from "jsonwebtoken";
// @ts-ignore
import bcryptjs from "bcryptjs";
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    bio: {
        type: String,
        required: true,
    },
    avatarUrl: {
        type: String,
    },
    media: [
        {
            url: { type: String },
            caption: { type: String, default: "" },
            public_id: { type: String },
            resource_type: { type: String },
            uploadedAt: { type: Date, default: Date.now },
        },
    ],
    followers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    refreshToken: {
        type: String,
    },
}, {
    timestamps: true,
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcryptjs.hash(this.password, 10);
    next();
});
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username,
        name: this.name,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
};
userSchema.methods.verifyPassword = async function (password) {
    return await bcryptjs.compare(password, this.password);
};
export const User = mongoose.model("User", userSchema);
