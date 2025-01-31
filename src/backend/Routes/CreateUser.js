const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

router.post(
  "/createuser",
  [
    // Validation for username, email, and password
    body(
      "username",
      "Username must be at least 5 characters long and contain no spaces"
    )
      .notEmpty()
      .isLength({ min: 5 })
      .matches(/^\S+$/),
    body("email", "Please enter a valid email").isEmail().notEmpty(),
    body(
      "password",
      "Password must be at least 8 characters long and contain no spaces"
    )
      .isLength({ min: 8 })
      .notEmpty()
      .matches(/^\S+$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Handle validation errors
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create the user
      const user = await User.create({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
      });
      // Hanle Duplicate responses
      const existedUser = await User.findOne({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      });
      if (existedUser) {
        return res
          .status(409)
          .json({ success: false, message: "User already exists" });
      }

      global.user = user;

      return res.status(201).json({ success: true, user });
    } catch (err) {
      console.error("Error creating user:", err.message);

      // Generic error response
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

module.exports = router;
