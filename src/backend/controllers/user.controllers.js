import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Requesting User Data from frontend
  const { username, email, password } = req.body;

  // Validation for email and password
  if ([email, password].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  //Duplicate responses check
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  //   create user in database
  const user = await User.create({
    username,
    email,
    password,
  });

  //   remove password and refreshtoken from response
  const createdUser = await User.findbyId(user._id).select(
    "-password -refreshToken"
  );

  //   Error handling
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  //   return a response
  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User Registered Successfully"));
});

export { registerUser };
