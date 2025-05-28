import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import path from "path";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadMedia = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // Make sure auth middleware sets req.user
  if (!userId) {
    throw new apiError(401, "Unauthorized: User not authenticated.");
  }

  const fileLocalPath = path.normalize(req.file?.path);
  if (!fileLocalPath) {
    throw new apiError(400, "File is required.");
  }

  const uploadedFile = await uploadOnCloudinary(fileLocalPath);
  if (!uploadedFile || !uploadedFile.url) {
    throw new apiError(500, "File upload failed.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found.");
  }

  if (!user.media) {
    user.media = [];
  }

  user.media.push({
    url: uploadedFile.url,
    public_id: uploadedFile.public_id,
    resource_type: uploadedFile.resource_type,
    uploadedAt: new Date(),
  });

  await user.save();

  console.log("User media updated:", user.media);

  res.status(200).json(
    new apiResponse(200, {
      message: "Media uploaded and user updated successfully.",
      media: user.media,
    })
  );
});

export { uploadMedia };
