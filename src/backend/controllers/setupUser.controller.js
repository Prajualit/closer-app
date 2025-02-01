import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const setupUser = asyncHandler(async (req, res) => {
  const { name, username, bio } = req.body;
  if ([name, username, bio].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }
  const existedUser = User.findOne({ username });
  if (existedUser) {
    throw new apiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatarUrl[0]?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const setupUser = await User.updateOne(
    {
      username: username,
    },
    {
      $set: {
        name,
        bio,
        avatarUrl: avatarUpload.url,
      },
    },
    { 
        upsert: false 
    },
    (error, result) => {
        console.log("error setting up user : ", error.message)
    }
  );
});

export { setupUser };
