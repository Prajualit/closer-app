import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import path from "path";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const uploadMedia = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not authenticated.");
    }
    const fileLocalPath = path.normalize(req.file?.path);
    if (!fileLocalPath) {
        throw new ApiError(400, "File is required.");
    }
    const uploadedFile = await uploadOnCloudinary(fileLocalPath);
    if (!uploadedFile || !uploadedFile.secure_url) {
        throw new ApiError(500, "File upload failed.");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    if (!user.media) {
        user.set('media', []);
    }
    user.media.push({
        url: uploadedFile.secure_url,
        caption: req.body.caption || "",
        public_id: uploadedFile.public_id,
        resource_type: uploadedFile.resource_type,
        uploadedAt: new Date(),
    });
    await user.save();
    console.log("User media updated:", user.media);
    res.status(200).json(new ApiResponse(200, {
        message: "Media uploaded and user updated successfully.",
        media: user.media,
    }));
});
export { uploadMedia };
