import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import path from "path";

const registerUser = asyncHandler(async (req, res) => {
  // Requesting User Data from frontend
  const { username, password, name, bio } = req.body;

  // Validation for email and password
  if ([username, password, name, bio].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  //Duplicate responses check
  const existedUser = await User.findOne({ username });
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
  console.log(avatarLocalPath);
  if (!avatarLocalPath) {
    throw new apiError(400, `Avatar is required ${avatarLocalPath}`);
  }

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarUpload || !avatarUpload.url) {
    throw new apiError(400, `Avatar upload failed ${avatarUpload}`);
  }

  //   create user in database
  const user = await User.create({
    username,
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

export { registerUser };
