import type { Request, Response, NextFunction } from "express";
import type { ObjectId } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: ObjectId | string;
        [key: string]: any;
      };
    }
  }
}

type AsyncHandlerFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncHandlerFn) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        return await fn(req, res, next);
    } catch (error: any) {
        // Handle MongoDB duplicate key error (code 11000)
        const statusCode = (error && typeof error === 'object' && 'code' in error && error.code === 11000)
            ? 409
            : (error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number')
                ? error.statusCode
                : 500;

        res.status(statusCode).json({
            success: false,
            message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
                ? error.message
                : 'Internal Server Error',
        });
    }
};

export { asyncHandler };