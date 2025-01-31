const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

router.post(
  "/loginuser",
  [
    body("email", "Please enter a valid email").isEmail().notEmpty(),
    body("password", "Password must be at least 8 characters long")
      .isLength({ min: 8 })
      .notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      let userData = await User.findOne({ email });
      const pwdCompare = await bcrypt.compare(
        req.body.password,
        userData.password
      );
      if (!pwdCompare) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Email or Password" });
      }

      const data = {
        user: {
          id: userData._id,
        },
      };

      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      return res.status(200).json({ success: true, authToken });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

module.exports = router;