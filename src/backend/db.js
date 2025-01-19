const mongoose = require("mongoose");
const mongo_URI = "mongodb+srv://prajualit:vesna8934@cluster0.1x6rm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const mongoDB = async () => {
  await mongoose.connect(mongo_URI);
};

module.exports = mongoDB;