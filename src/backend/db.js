const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongoDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

module.exports = mongoDB;