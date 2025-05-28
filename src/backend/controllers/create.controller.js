import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import path from "path";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const create = asyncHandler(async (req, res) => {
  const photoLocalPath = path.normalize(req.file?.path);
  if (!photoLocalPath) {
    throw new apiError(400, `Avatar is required ${photoLocalPath}`);
  }

  const photoUpload = await uploadOnCloudinary(photoLocalPath);
  if (!photoUpload || !photoUpload.url) {
    throw new apiError(400, `Avatar upload failed ${photoUpload}`);
  }

  

});
