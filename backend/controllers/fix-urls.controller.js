import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Utility function to convert HTTP cloudinary URLs to HTTPS
const fixCloudinaryUrls = asyncHandler(async (req, res) => {
  try {
    console.log("Starting Cloudinary URL fix...");
    
    // Fix avatar URLs
    const avatarResult = await User.updateMany(
      { avatarUrl: { $regex: "^http://res.cloudinary.com" } },
      [{ 
        $set: { 
          avatarUrl: { 
            $replaceOne: { 
              input: "$avatarUrl", 
              find: "http://", 
              replacement: "https://" 
            } 
          } 
        } 
      }]
    );
    
    // Fix media URLs
    const mediaResult = await User.updateMany(
      { "media.url": { $regex: "^http://res.cloudinary.com" } },
      [{ 
        $set: { 
          "media.$[].url": { 
            $replaceOne: { 
              input: "$media.$[].url", 
              find: "http://", 
              replacement: "https://" 
            } 
          } 
        } 
      }]
    );
    
    console.log(`Fixed ${avatarResult.modifiedCount} avatar URLs`);
    console.log(`Fixed ${mediaResult.modifiedCount} media URLs`);
    
    return res.status(200).json(
      new ApiResponse(200, {
        avatarsFixed: avatarResult.modifiedCount,
        mediaFixed: mediaResult.modifiedCount
      }, "Cloudinary URLs fixed successfully")
    );
    
  } catch (error) {
    console.error("Error fixing URLs:", error);
    throw new ApiError(500, "Failed to fix Cloudinary URLs");
  }
});

export { fixCloudinaryUrls };
