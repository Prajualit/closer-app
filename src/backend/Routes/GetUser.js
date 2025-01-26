const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/getuser", async (req, res) => {
  try {
    if (global.profile) {
      res.send(global.profile);
    } else {
      res.status(400).send("User not found");
    }
  } catch (err) {
    console.log(err.message);
    res.status(400).send("Server Error");
  }
});

module.exports = router;