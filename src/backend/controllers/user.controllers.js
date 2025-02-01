import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

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

  const user = await User.create({
    username,
    email,
    password,
  })

});

export { registerUser };
