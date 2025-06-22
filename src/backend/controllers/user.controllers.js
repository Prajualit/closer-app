import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import path, { normalize } from "path";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      error?.message ||
        "Something went wrong while generating Access and Refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Requesting User Data from frontend
  const { username, password, name, bio } = req.body;

  // Validation of the body
  if ([username, password, name, bio].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }
  const normalizedUsername = username.trim().toLowerCase();
  //Duplicate responses check
  const existedUser = await User.findOne({ username: normalizedUsername });
  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  // req.files = { ...req.files };
  // let avatarLocalPath = null;
  // if(!req.files?.avatarUrl) {
  //   avatarLocalPath = path.normalize(req.files?.avatarUrl[0]?.path);
  // }else if(!req.files?.avatarUrl[0]) {
  //   avatarLocalPath = path.normalize(req.files?.avatarUrl.path);
  // }
  const avatarLocalPath = path.normalize(req.file?.path);
  if (!avatarLocalPath) {
    throw new apiError(400, `Avatar is required ${avatarLocalPath}`);
  }

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarUpload || !avatarUpload.url) {
    throw new apiError(400, `Avatar upload failed ${avatarUpload}`);
  }

  //   create user in database
  const user = await User.create({
    username: normalizedUsername,
    password,
    name,
    bio,
    avatarUrl: !avatarUpload.url ? "" : avatarUpload.url,
  });

  //   remove password and refreshtoken from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  //   return a response
  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User Registered Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "User fetched successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get the body
  const { username, password } = req.body;

  // validation of the body
  if ([username, password].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  // verify if user exists or not
  const normalisedUsername = username.trim().toLowerCase();
  const user = await User.findOne({ username: normalisedUsername });
  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  // verify password
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid username or password");
  }

  // generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = { httpOnly: true, secure: false };

  // send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = { httpOnly: true, secure: false };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const editUser = asyncHandler(async (req, res) => {
  const { name, bio, username } = req.body;

  const normalizedUsername = username.trim().toLowerCase();

  let avatarUrl = null;

  if (req.file?.path) {
    const avatarLocalPath = path.normalize(req.file.path);

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUpload || !avatarUpload.url) {
      throw new apiError(400, "Avatar upload failed");
    }
    avatarUrl = avatarUpload.url;
  }

  const updateFields = {};

  if (username && username.trim()) {
    updateFields.username = normalizedUsername;
  }

  if (name !== undefined) {
    updateFields.name = name;
  }

  if (bio !== undefined) {
    updateFields.bio = bio;
  }

  if (avatarUrl) {
    updateFields.avatarUrl = avatarUrl;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateFields,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new apiError(500, "Something went wrong while updating the user");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "User updated successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }

    const options = { httpOnly: true, secure: false };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getCurrentUser,
  editUser,
};
