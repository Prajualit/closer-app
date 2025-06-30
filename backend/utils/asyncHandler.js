const asyncHandler = (fn) => async (req, res, next) => {
    try {
        return await fn(req, res, next);
    } catch (error) {
        // Handle MongoDB duplicate key error (code 11000)
        const statusCode = error.code === 11000 ? 409 : error.statusCode || 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export { asyncHandler };