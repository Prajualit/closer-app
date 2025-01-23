const mongoose = require("mongoose");

const { Schema } = mongoose;

const profileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String, 
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    required: false,
  },
  avatarUrl: {
    type: String,
    required: false,
  }
});

module.exports = mongoose.model("profile", profileSchema)
