
import mongoose, { Schema, Document } from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export interface UserDocument extends Document {
  _id: string;
  username: string;
  password: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  media: Array<any>;
  followers: Array<string>;
  following: Array<string>;
  refreshToken?: string;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  verifyPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcryptjs.hash(this.password, 10);
  next();
});


userSchema.methods.generateAccessToken = function (this: UserDocument): string {
  const secret = process.env.ACCESS_TOKEN_SECRET || "default_secret";
  const expiryRaw = process.env.ACCESS_TOKEN_EXPIRY;
  let options: SignOptions = {};
  if (expiryRaw) {
    if (!isNaN(Number(expiryRaw))) {
      options.expiresIn = Number(expiryRaw);
    } else {
      const allowed = /^\d+[smhdwy]$/i;
      if (allowed.test(expiryRaw)) {
        options.expiresIn = expiryRaw as any;
      }
    }
  }
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      name: this.name,
    },
    secret,
    options
  );
};

userSchema.methods.generateRefreshToken = function (this: UserDocument): string {
  const secret = process.env.REFRESH_TOKEN_SECRET || "default_secret";
  const expiryRaw = process.env.REFRESH_TOKEN_EXPIRY;
  let options: SignOptions = {};
  if (expiryRaw) {
    if (!isNaN(Number(expiryRaw))) {
      options.expiresIn = Number(expiryRaw);
    } else {
      const allowed = /^\d+[smhdwy]$/i;
      if (allowed.test(expiryRaw)) {
        options.expiresIn = expiryRaw as SignOptions["expiresIn"];
      }
    }
  }
  return jwt.sign(
    {
      _id: this._id,
    },
    secret,
    options
  );
};

userSchema.methods.verifyPassword = async function (this: UserDocument, password: string): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

export const User = mongoose.model<UserDocument>("User", userSchema);
