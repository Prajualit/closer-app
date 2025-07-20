import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS URLs
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Normalize path
    const normalizedPath = path.resolve(localFilePath);
    console.log("Uploading file from:", normalizedPath);

    // Ensure file exists
    if (!fs.existsSync(normalizedPath)) {
      console.error("File not found:", normalizedPath);
      return null;
    }

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
      secure: true, // Ensure HTTPS URL in response
    });

    console.log("Media uploaded to Cloudinary:", response.secure_url);

    // Delete local file after successful upload
    fs.unlinkSync(normalizedPath);

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };
