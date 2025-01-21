const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

router.post(
  "/createuser",
  [
    body("username", "Username must be at least 5 characters long")
      .notEmpty()
      .isLength({ min: 5 }).matches(/^\S+$/),
    body("email", "Please enter a valid email").isEmail().notEmpty(),
    body("password", "Password must be at least 8 characters long")
      .isLength({ min: 8 })
      .notEmpty().matches(/^\S+$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const user = await User.create({
        name: req.body.name,
        password: hashedPassword,
        email: req.body.email,
      });

      return res.status(201).json({ success: true, user });
    } catch (err) {
      console.error("Error creating user:", err.message);

      if (err.code === 11000) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);



module.exports = router;