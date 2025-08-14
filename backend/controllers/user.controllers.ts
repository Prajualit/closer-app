import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import path, { normalize } from "path";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { access } from "fs";
import { notifyFollow } from "./notification.controller.js";

const generateAccessAndRefreshTokens = async (userId: string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const user = await User.findById(String(userId));
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(
      500,
      error?.message ||
        "Something went wrong while generating Access and Refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req: any, res: any) => {
  console.log("🔥 Registration attempt started");
  console.log("📦 Request body:", req.body);
  console.log("📁 Request file:", req.file);
  
  // Requesting User Data from frontend
  const { username, password, name } = req.body;

  // Validation of the body
  if ([username, password, name].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const normalizedUsername = username.trim().toLowerCase();
  //Duplicate responses check
  const existedUser = await User.findOne({ username: normalizedUsername });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // req.files = { ...req.files };
  // let avatarLocalPath = null;
  // if(!req.files?.avatarUrl) {
  //   avatarLocalPath = path.normalize(req.files?.avatarUrl[0]?.path);
  // }else if(!req.files?.avatarUrl[0]) {
  //   avatarLocalPath = path.normalize(req.files?.avatarUrl.path);
  // }
  // const avatarLocalPath = req.file?.path ? path.normalize(req.file.path) : null;
  // if (!avatarLocalPath || !req.file) {
  //   console.error("❌ Avatar upload failed:", {
  //     file: req.file,
  //     body: req.body,
  //     files: req.files
  //   });
  //   throw new ApiError(400, "Avatar is required and upload failed");
  // }

  // const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  // if (!avatarUpload || !avatarUpload.secure_url) {
  //   throw new ApiError(400, `Avatar upload failed ${avatarUpload}`);
  // }

  //   create user in database
  const user = await User.create({
    username: normalizedUsername,
    password,
    name,
    // avatarUrl: avatarUpload.secure_url || "",
  });

  //   remove password and refreshtoken from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Generate tokens to automatically log the user in
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    String(user._id)
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    // For production deployment on different domains
    ...(process.env.NODE_ENV === "production" && { 
      domain: process.env.COOKIE_DOMAIN || undefined
    })
  };

  //   return a response with tokens (auto-login)
  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200, 
        { user: createdUser, accessToken, refreshToken }, 
        "User registered and logged in successfully"
      )
    );
});

const getCurrentUser = asyncHandler(async (req: any, res: any) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const loginUser = asyncHandler(async (req: any, res: any) => {
  // get the body
  const { username, password } = req.body;

  // validation of the body
  if ([username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // verify if user exists or not
  const normalisedUsername = username.trim().toLowerCase();
  const user = await User.findOne({ username: normalisedUsername });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // verify password
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid username or password");
  }

  // generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    String(user._id)
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    // For production deployment on different domains
    ...(process.env.NODE_ENV === "production" && { 
      domain: process.env.COOKIE_DOMAIN || undefined
    })
  };

  // send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req: any, res: any) => {
  await User.findByIdAndUpdate(
    String(req.user._id),
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" as const,
    path: "/",
    // For production deployment on different domains
    ...(process.env.NODE_ENV === "production" && { 
      domain: process.env.COOKIE_DOMAIN || undefined
    })
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const editUser = asyncHandler(async (req: any, res: any) => {
  const { name, bio, username } = req.body;

  const updateFields: Record<string, any> = {};

  if (username && username.trim()) {
    const normalizedUsername = username.trim().toLowerCase();
    updateFields["username"] = normalizedUsername;
  }

  if (name !== undefined && name !== null && name.trim()) {
    updateFields["name"] = name;
  }

  if (bio !== undefined && bio !== null && bio.trim()) {
    updateFields["bio"] = bio;
  }

  if (req.file?.path) {
    const avatarLocalPath = path.normalize(req.file.path);

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUpload || !avatarUpload.secure_url) {
      throw new ApiError(400, "Avatar upload failed");
    }

    updateFields["avatarUrl"] = avatarUpload.secure_url;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No fields provided for update");
  }

  const updateResult = await User.updateOne(
    { _id: String(req.user._id) },
    { $set: updateFields }
  );

  if (updateResult.matchedCount === 0) {
    throw new ApiError(404, "User not found");
  }

  if (updateResult.modifiedCount === 0) {
    throw new ApiError(400, "No changes were made");
  }

  // Get the updated user
  const user = await User.findById(String(req.user._id));

  if (!user) {
    throw new ApiError(500, "Something went wrong while fetching updated user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    String(user._id)
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    // For production deployment on different domains
    ...(process.env.NODE_ENV === "production" && { 
      domain: process.env.COOKIE_DOMAIN || undefined
    })
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User updated successfully"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req: any, res: any) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
      throw new ApiError(500, "Refresh token secret is not configured");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      secret
    ) as { _id: string };

    const user = await User.findById(String(decodedToken._id));

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
      // For production deployment on different domains
      ...(process.env.NODE_ENV === "production" && { 
        domain: process.env.COOKIE_DOMAIN || undefined
      })
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(String(user._id));

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error && error.message ? error.message : "Invalid refresh token");
  }
});

const verifyPassword = asyncHandler(async (req: any, res: any) => {
  const { currentPassword } = req.body;

  // Validation
  if (!currentPassword || currentPassword.trim() === "") {
    throw new ApiError(400, "Current password is required");
  }

  // Get user from database
  const user = await User.findById(String(req.user._id));
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isPasswordValid = await user.verifyPassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password verified successfully"));
});

const changePassword = asyncHandler(async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (currentPassword.trim() === "" || newPassword.trim() === "") {
    throw new ApiError(400, "Passwords cannot be empty");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from current password"
    );
  }

  // Get user from database
  const user = await User.findById(String(req.user._id));
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isPasswordValid = await user.verifyPassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const deleteUserAccount = asyncHandler(async (req: any, res: any) => {
  const user = await User.findByIdAndDelete(String(req.user._id));
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    // For production deployment on different domains
    ...(process.env.NODE_ENV === "production" && { 
      domain: process.env.COOKIE_DOMAIN || undefined
    })
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User account deleted successfully"));
});

const searchUsers = asyncHandler(async (req: any, res: any) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const searchRegex = new RegExp(query.trim(), "i");

  const users = await User.find({
    $or: [{ username: searchRegex }, { name: searchRegex }],
    _id: { $ne: String(req.user._id) }, // Exclude current user
  })
    .select("username name avatarUrl bio")
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully"));
});

// Get user profile by ID
const getUserProfile = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;

  // Validate if userId is a valid MongoDB ObjectId
  if (!userId || typeof userId !== "string" || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const user = await User.findById(String(userId))
    .select("-password -refreshToken")
    .populate('followers', 'username name avatarUrl')
    .populate('following', 'username name avatarUrl');

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userProfile = {
    ...user.toObject(),
    followersCount: user.followers.length,
    followingCount: user.following.length,
  };

  return res.status(200).json(
    new ApiResponse(200, { user: userProfile }, "User profile fetched successfully")
  );
});

// Follow a user
const followUser = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.body;
  const currentUserId = String(req.user._id);

  if (userId === currentUserId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const userToFollow = await User.findById(String(userId));
  const currentUser = await User.findById(currentUserId);

  if (!userToFollow) {
    throw new ApiError(404, "User not found");
  }
  if (!currentUser) {
    throw new ApiError(404, "Current user not found");
  }

  // Check if already following
  if (currentUser.following.map((id: any) => id.toString()).includes(userId)) {
    throw new ApiError(400, "You are already following this user");
  }

  // Add to following/followers
  currentUser.following.push(userId);
  userToFollow.followers.push(currentUserId);

  await currentUser.save();
  await userToFollow.save();

  // Create follow notification
  try {
    await notifyFollow(currentUserId, String(userId));
  } catch (error) {
    console.error("Failed to create follow notification:", error);
    // Don't fail the follow operation if notification fails
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "User followed successfully")
  );
});

// Unfollow a user
const unfollowUser = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.body;
  const currentUserId = String(req.user._id);

  if (userId === currentUserId) {
    throw new ApiError(400, "You cannot unfollow yourself");
  }

  const userToUnfollow = await User.findById(String(userId));
  const currentUser = await User.findById(currentUserId);

  if (!userToUnfollow) {
    throw new ApiError(404, "User not found");
  }
  if (!currentUser) {
    throw new ApiError(404, "Current user not found");
  }

  // Check if not following
  if (!currentUser.following.map((id: any) => id.toString()).includes(userId)) {
    throw new ApiError(400, "You are not following this user");
  }

  // Remove from following/followers
  currentUser.following = currentUser.following.filter((id: any) => id.toString() !== userId);
  userToUnfollow.followers = userToUnfollow.followers.filter((id: any) => id.toString() !== currentUserId);

  await currentUser.save();
  await userToUnfollow.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "User unfollowed successfully")
  );
});

// Get follow status
const getFollowStatus = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  const currentUserId = String(req.user._id);

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    throw new ApiError(404, "Current user not found");
  }
  const isFollowing = currentUser.following.map((id: any) => id.toString()).includes(userId);

  return res.status(200).json(
    new ApiResponse(200, { isFollowing }, "Follow status fetched successfully")
  );
});

// Get user photos
const getUserPhotos = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;

  const user = await User.findById(String(userId));
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const photos = Array.isArray(user.media)
    ? user.media.filter((item: any) => 
        item.resource_type === 'image' || 
        !item.resource_type || 
        (typeof item.url === 'string' && item.url.match(/\.(jpeg|jpg|gif|png)$/i))
      )
    : [];

  return res.status(200).json(
    new ApiResponse(200, { photos }, "User photos fetched successfully")
  );
});

// Get user films/videos
const getUserFilms = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;

  const user = await User.findById(String(userId));
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const films = Array.isArray(user.media)
    ? user.media.filter((item: any) => 
        item.resource_type === 'video' || 
        (typeof item.url === 'string' && item.url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i))
      )
    : [];

  return res.status(200).json(
    new ApiResponse(200, { films }, "User films fetched successfully")
  );
});

export {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getCurrentUser,
  editUser,
  verifyPassword,
  changePassword,
  deleteUserAccount,
  searchUsers,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowStatus,
  getUserPhotos,
  getUserFilms,
};

