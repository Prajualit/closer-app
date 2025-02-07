import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const loginUser = asyncHandler(async (req, res) => {
  // get the body
  const { username, password } = req.body;
  // validation of the body
  if ([username, password].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }
  // verify if user exists or not
  const normalisedUsername = username.trim().toLowerCase();
  const user = await User.findOne({
    username: normalisedUsername,
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }
  // verify password
  const isPasswordValid = await User.findOne({
    
  })
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid password");
  }

  // generate tokens
  // send response
});

export { loginUser };
