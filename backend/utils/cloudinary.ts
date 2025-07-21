import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary environment variables are not set");
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS URLs
});

const uploadOnCloudinary = async (localFilePath: string): Promise<any | null> => {
  try {
    if (!localFilePath || typeof localFilePath !== 'string') return null;

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

    if (response && typeof response === 'object' && 'secure_url' in response) {
      console.log("Media uploaded to Cloudinary:", response.secure_url);
    } else {
      console.log("Media uploaded to Cloudinary, but no secure_url in response.");
    }

    // Delete local file after successful upload
    fs.unlinkSync(normalizedPath);

    return response;
  } catch (error: any) {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      console.error("Cloudinary Upload Error:", error.message);
    } else {
      console.error("Cloudinary Upload Error:", String(error));
    }

    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };
