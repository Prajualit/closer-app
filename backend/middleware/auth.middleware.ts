import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, UserDocument } from "../models/user.model.js";


export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If cookies is undefined, fallback to empty object
      const cookies = (req as any).cookies || {};
      
      // Check multiple sources for token
      const token =
        cookies.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "") ||
        req.body.accessToken; // Support localStorage fallback via request body
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const secret = process.env.ACCESS_TOKEN_SECRET || "default_secret";
      const decoded = jwt.verify(token, secret);
      // decoded can be string or JwtPayload
      let userId: string | undefined;
      if (typeof decoded === "object" && decoded !== null && "_id" in decoded) {
        userId = (decoded as JwtPayload & { _id?: string })._id;
      }
      if (!userId) {
        throw new ApiError(401, "Invalid Access token");
      }

      const user = await User.findById(userId).select("-password -refreshToken");
      if (!user) {
        throw new ApiError(401, "Invalid Access token");
      }

      req.user = user;
      next();
    } catch (error) {
      let message = "Invalid Access token";
      if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
        message = (error as any).message;
      }
      throw new ApiError(401, message);
    }
  }
);

export { verifyJWT as verifyJwt };