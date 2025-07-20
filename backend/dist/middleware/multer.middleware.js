// @ts-ignore
import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Simple destination - use temp folder that exists
        cb(null, "./temp");
    },
    filename: function (req, file, cb) {
        // Simple unique filename
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
