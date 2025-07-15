import multer from "multer";
import os from "os";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory in production, local temp in development
    const tempDir = process.env.NODE_ENV === "production" ? os.tmpdir() : "./temp";
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Add timestamp to prevent filename conflicts
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
