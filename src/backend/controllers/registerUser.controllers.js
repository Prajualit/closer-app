import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import path from "path";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  // Requesting User Data from frontend
  const { username, password, name, bio } = req.body;

  // Validation for and password
  if ([username, password, name, bio].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }
  const normalizedUsername = username.trim().toLowerCase();
  //Duplicate responses check
  const existedUser = await User.findOne({ username: normalizedUsername });
  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  req.files = { ...req.files };
  // let avatarLocalPath = null;
  // if(!req.files?.avatarUrl) {
  //   avatarLocalPath = path.normalize(req.files?.avatarUrl[0]?.path);
  // }else if(!req.files?.avatarUrl[0]) {
  //   avatarLocalPath = path.normalize(req.files?.avatarUrl.path);
  // }
  const avatarLocalPath = path.normalize(req.files?.avatarUrl[0]?.path);
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

const getUser = asyncHandler(async (req, res) => {
  console.log("Cookies:", req.cookies); // Debugging: Print all cookies

  const token = req.cookies.accessToken;
  if (!token) {
    throw new apiError(401, "Access token missing or undefined");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("JWT Verification Error:", err);
    throw new apiError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res.status(200).json(new apiResponse(200, user, "User Data Fetched Successfully"));
});

export { registerUser, getUser };
