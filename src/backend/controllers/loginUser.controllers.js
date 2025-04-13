import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";

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
      error?.message || "Something went wrong while generating Access and Refresh Token"
    );
  }
};

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

  const options = {
    httpOnly: true,
    secure: true,
  };

  // send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res.status(200).
  clearCookie("accessToken", options).
  clearCookie("refreshToken", options).
  json(new apiResponse(200, {}, "User logged out successfully"));

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    
})

export { loginUser, logoutUser };
