import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { notifyLike, notifyComment } from "./notification.controller.js";

import type { Request, Response } from "express";
import type { ObjectId } from "mongoose";
interface AuthUser {
  _id: ObjectId | string;
  [key: string]: any;
}
interface AuthRequest extends Request {
  user: AuthUser;
}

// Get a single post (with a specific media item) by postId and mediaId
const getSinglePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId, mediaId } = req.params;
  const currentUserId = req.user._id;

  if (!postId || !mediaId) {
    throw new ApiError(400, "Post ID and Media ID are required");
  }

  // Find the user (post owner) and the specific media item
  const user = await User.findById(postId).lean();
  if (!user) {
    throw new ApiError(404, "Post not found");
  }
  const media = user.media?.find((m: any) => m._id?.toString() === mediaId);
  if (!media) {
    throw new ApiError(404, "Media not found for this post");
  }

  // Get likes and comments for this post/media
  const likes = await Like.find({ postId, mediaId });
  const comments = await Comment.find({ postId, mediaId })
    .populate("userId", "username avatarUrl")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const likesCount = likes.length;
  const commentsCount = comments.length;
  const isLikedByCurrentUser = likes.some((like: any) => like.userId.toString() === currentUserId.toString());

  const post = {
    _id: user._id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    media: {
      _id: media._id,
      url: media.url,
      caption: media.caption,
      resource_type: media.resource_type,
      uploadedAt: media.uploadedAt,
    },
    title: media.caption, // or user.title if you have it
    content: media.caption, // or user.content if you have it
    likesCount,
    commentsCount,
    isLikedByCurrentUser,
    comments: comments.map((c: any) => ({
      _id: c._id,
      text: c.text,
      user: c.userId,
    })),
  };

  return res.status(200).json(
    new ApiResponse(200, { post }, "Post fetched successfully")
  );
});

// Get likes count and like status for a post/media
const getLikesCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  let { postId, mediaId } = req.params;
  const userId = req.user._id;
  postId = postId?.toString();
  mediaId = mediaId?.toString();

  // Count likes
  const likesCount = await Like.countDocuments({ postId, mediaId });
  // Check if current user liked
  const isLikedByCurrentUser = !!(await Like.findOne({
    postId,
    mediaId,
    userId,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likesCount, isLikedByCurrentUser },
        "Likes count fetched successfully"
      )
    );
});
// Get all posts from all users with pagination
const getAllPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Parse page and limit as numbers, handling arrays and undefined
  function toNum(val: any, def: number) {
    if (Array.isArray(val)) val = val[0];
    const n = Number(val);
    return isNaN(n) ? def : n;
  }
  const page = toNum(req.query.page, 1);
  const limit = toNum(req.query.limit, 10);
  const type = req.query.type;
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id;

  console.log("getAllPosts called with:", { page, limit, type, currentUserId });

  // Build match criteria for media type filtering
  const matchCriteria: Record<string, any> = {};
  if (type === "video") {
    matchCriteria["media.resource_type"] = "video";
  } else if (type === "image") {
    matchCriteria["media.resource_type"] = "image";
  }

  console.log("Match criteria:", matchCriteria);

  // Get all users with their media, sorted by upload date
  const posts = await User.aggregate([
    {
      $unwind: "$media",
    },
    // Add type filtering if specified
    ...(Object.keys(matchCriteria).length > 0
      ? [{ $match: matchCriteria }]
      : []),
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
            $limit: 10,
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
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  // console.log('Posts found:', posts.length);
  // console.log('First post sample:', posts[0] ? {
  //   id: posts[0]._id,
  //   username: posts[0].username,
  //   mediaType: posts[0].media?.resource_type,
  //   mediaUrl: posts[0].media?.url
  // } : 'No posts');

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        currentPage: page,
        hasMore: posts.length === limit,
      },
      "Posts fetched successfully"
    )
  );
});

// Like a post
const likePost = asyncHandler(async (req: AuthRequest, res: Response) => {
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
        await notifyLike(
          String(userId),
          String(postId),
          String(postId)
        );
      } catch (error) {
        const err = error as any;
        console.warn("Failed to send like notification:", err?.message ?? err);
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
    const err = error as any;
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      throw new ApiError(400, "Post already liked");
    }
    throw error;
  }
});

// Unlike a post
const unlikePost = asyncHandler(async (req: AuthRequest, res: Response) => {
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
const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  let { postId, mediaId, text } = req.body;
  const userId = req.user._id;

  if (!postId || !mediaId || !text) {
    throw new ApiError(400, "Post ID, Media ID, and comment text are required");
  }

  if (text.trim().length === 0) {
    throw new ApiError(400, "Comment cannot be empty");
  }

  // Always save as strings for consistent querying
  postId = postId.toString();
  mediaId = mediaId.toString();

  const newComment = await Comment.create({
    userId,
    postId,
    mediaId,
    text: text.trim(),
  });

  // Send notification to post owner (if not commenting on own post)
  if (userId.toString() !== postId.toString()) {
    try {
      await notifyComment(
        String(userId),
        String(postId),
        String(postId),
        String(newComment._id)
      );
    } catch (error) {
      const err = error as any;
      console.warn("Failed to send comment notification:", err?.message ?? err);
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
const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  let { postId, mediaId } = req.params;
  function toNum(val: any, def: number) {
    if (Array.isArray(val)) val = val[0];
    const n = Number(val);
    return isNaN(n) ? def : n;
  }
  const page = toNum(req.query.page, 1);
  const limit = toNum(req.query.limit, 20);
  const skip = (page - 1) * limit;

  // Ensure both are strings for matching
  postId = String(postId);
  mediaId = String(mediaId);

  console.log("getComments called with:", { postId, mediaId, page, limit });

  const query = { postId, mediaId };
  console.log("MongoDB query:", query);

  const comments = await Comment.find(query)
    .populate("userId", "username avatarUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalComments = await Comment.countDocuments(query);

  console.log(
    "Comments found:",
    comments.length,
    "First comment:",
    comments[0]
  );

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
const getSuggestedUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = req.user._id;
  const { limit = 5 } = req.query;

  const currentUser = await User.findById(currentUserId);
  const followingIds = currentUser?.following || [];

  // Get users not followed by current user and exclude current user
  const suggestedUsers = await User.find({
    _id: {
      $nin: [...followingIds, currentUserId],
    },
  })
    .select("username name avatarUrl bio followers")
    .limit(typeof limit === "number" ? limit : Array.isArray(limit) ? parseInt(limit[0] as string) : parseInt(limit as string))
    .lean();

  // Add followers count to each user
  const usersWithFollowersCount = suggestedUsers.map((user) => ({
    ...user,
    followersCount: user && user.followers ? user.followers.length : 0,
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
const getUserActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  const stats = user ? {
    postsCount: user.media ? user.media.length : 0,
    followersCount: user.followers ? user.followers.length : 0,
    followingCount: user.following ? user.following.length : 0,
  } : {
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
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
  getLikesCount,
  getSinglePost,
};
