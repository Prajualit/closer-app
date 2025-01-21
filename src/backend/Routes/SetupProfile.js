const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const multer = require("multer");

// Multer configuration to handle file uploads
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Only accept specific image types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/webp"];
    if (file && allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if( !file ){
        cb(null, true)
    }
    else {
      cb(new Error("Only JPEG, PNG, and GIF files are allowed!"), false);
    }
  },
});

// Profile setup route
router.post(
  "/setupprofile",
  upload.single("avatar"), // Multer middleware to handle file upload
  [
    // Name validation
    body("name", "Name must be at least 5 characters long")
      .notEmpty()
      .isLength({ min: 5 }),

    // Password validation
    body("username", "Username must be at least 5 characters long")
      .notEmpty()
      .isLength({ min: 5 }).matches(/^\S+$/),

    // Bio validation
    body("bio", "Bio must not exceed 200 characters")
      .optional()
      .isLength({ max: 200 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // If validation errors exist, return them
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, username, bio } = req.body;
    const avatarUrl = req.file ? req.file.path : null;

    res.status(201).json({
      message: "Profile setup successfully!",
      data: {
        name,
        username,
        bio,
        avatarUrl,
      },
    });
  }
);

module.exports = router;
