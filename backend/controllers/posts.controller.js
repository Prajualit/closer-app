import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { notifyLike, notifyComment } from "./notification.controller.js";

// Get all posts from all users with pagination
const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id;

  // Get all users with their media, sorted by upload date
  const posts = await User.aggregate([
    {
      $unwind: "$media",
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $lookup: {
        from: "likes",
        let: {
          postId: "$userInfo._id",
          mediaId: { $toString: "$media._id" },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$postId", "$$postId"] },
                  { $eq: ["$mediaId", "$$mediaId"] },
                ],
              },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: {
          postId: "$userInfo._id",
          mediaId: { $toString: "$media._id" },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$postId", "$$postId"] },
                  { $eq: ["$mediaId", "$$mediaId"] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $project: {
              text: 1,
              createdAt: 1,
              "user.username": 1,
              "user.avatarUrl": 1,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 3,
          },
        ],
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" },
        isLikedByCurrentUser: {
          $in: [currentUserId, "$likes.userId"],
        },
      },
    },
    {
      $project: {
        _id: "$userInfo._id",
        username: "$userInfo.username",
        name: "$userInfo.name",
        bio: "$userInfo.bio",
        avatarUrl: "$userInfo.avatarUrl",
        media: {
          _id: "$media._id",
          url: "$media.url",
          caption: "$media.caption",
          resource_type: "$media.resource_type",
          uploadedAt: "$media.uploadedAt",
        },
        likesCount: 1,
        commentsCount: 1,
        isLikedByCurrentUser: 1,
        comments: 1,
      },
    },
    {
      $sort: { "media.uploadedAt": -1 },
    },
    {
      $skip: parseInt(skip),
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        currentPage: parseInt(page),
        hasMore: posts.length === parseInt(limit),
      },
      "Posts fetched successfully"
    )
  );
});

// Like a post
const likePost = asyncHandler(async (req, res) => {
  const { postId, mediaId } = req.body;
  const userId = req.user._id;

  if (!postId || !mediaId) {
    throw new ApiError(400, "Post ID and Media ID are required");
  }

  try {
    // Check if already liked
    const existingLike = await Like.findOne({ userId, postId, mediaId });

    if (existingLike) {
      throw new ApiError(400, "Post already liked");
    }

    // Create new like
    const newLike = await Like.create({ userId, postId, mediaId });

    // Send notification to post owner (if not liking own post)
    if (userId.toString() !== postId.toString()) {
      try {
        await notifyLike(userId, postId, postId);
      } catch (error) {
        console.warn('Failed to send like notification:', error.message);
      }
    }

    // Get updated likes count
    const likesCount = await Like.countDocuments({ postId, mediaId });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { likesCount, liked: true },
          "Post liked successfully"
        )
      );
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, "Post already liked");
    }
    throw error;
  }
});

// Unlike a post
const unlikePost = asyncHandler(async (req, res) => {
  const { postId, mediaId } = req.body;
  const userId = req.user._id;

  if (!postId || !mediaId) {
    throw new ApiError(400, "Post ID and Media ID are required");
  }

  const deletedLike = await Like.findOneAndDelete({ userId, postId, mediaId });

  if (!deletedLike) {
    throw new ApiError(404, "Like not found");
  }

  // Get updated likes count
  const likesCount = await Like.countDocuments({ postId, mediaId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likesCount, liked: false },
        "Post unliked successfully"
      )
    );
});

// Add comment to post
const addComment = asyncHandler(async (req, res) => {
  const { postId, mediaId, text } = req.body;
  const userId = req.user._id;

  if (!postId || !mediaId || !text) {
    throw new ApiError(400, "Post ID, Media ID, and comment text are required");
  }

  if (text.trim().length === 0) {
    throw new ApiError(400, "Comment cannot be empty");
  }

  const newComment = await Comment.create({
    userId,
    postId,
    mediaId,
    text: text.trim(),
  });

  // Send notification to post owner (if not commenting on own post)
  if (userId.toString() !== postId.toString()) {
    try {
      await notifyComment(userId, postId, postId, newComment._id);
    } catch (error) {
      console.warn('Failed to send comment notification:', error.message);
    }
  }

  // Populate the comment with user info
  const populatedComment = await Comment.findById(newComment._id)
    .populate("userId", "username avatarUrl")
    .lean();

  // Get updated comments count
  const commentsCount = await Comment.countDocuments({ postId, mediaId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comment: populatedComment,
        commentsCount,
      },
      "Comment added successfully"
    )
  );
});

// Get comments for a post
const getComments = asyncHandler(async (req, res) => {
  const { postId, mediaId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({ postId, mediaId })
    .populate("userId", "username avatarUrl")
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .lean();

  const totalComments = await Comment.countDocuments({ postId, mediaId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        totalComments,
        hasMore: skip + comments.length < totalComments,
      },
      "Comments fetched successfully"
    )
  );
});

// Get suggested users (users not followed by current user)
const getSuggestedUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { limit = 5 } = req.query;

  const currentUser = await User.findById(currentUserId);
  const followingIds = currentUser.following || [];

  // Get users not followed by current user and exclude current user
  const suggestedUsers = await User.find({
    _id: {
      $nin: [...followingIds, currentUserId],
    },
  })
    .select("username name avatarUrl bio followers")
    .limit(parseInt(limit))
    .lean();

  // Add followers count to each user
  const usersWithFollowersCount = suggestedUsers.map((user) => ({
    ...user,
    followersCount: user.followers ? user.followers.length : 0,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users: usersWithFollowersCount },
        "Suggested users fetched successfully"
      )
    );
});

// Get user activity stats
const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  const stats = {
    postsCount: user.media ? user.media.length : 0,
    followersCount: user.followers ? user.followers.length : 0,
    followingCount: user.following ? user.following.length : 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "User activity fetched successfully"));
});

export {
  getAllPosts,
  likePost,
  unlikePost,
  addComment,
  getComments,
  getSuggestedUsers,
  getUserActivity,
};
