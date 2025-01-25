const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongoDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Access the 'users' collection
    const fetched_user = mongoose.connection.db.collection("users");
    const fetched_profile = mongoose.connection.db.collection("profiles");

    // Fetch one document
    const profile = await fetched_profile.findOne({});
    const user = await fetched_user.find({})
    if (user[0]) {
      const matchingProfile = await fetched_profile.findOne({
        username: user[0].username, // Match on username
      });

      console.log("Fetched User:", user[0]);
      console.log("Matching Profile:", matchingProfile);

      return { user: user[0], profile: matchingProfile };
      console.log("Fetched User:", user);
      console.log("Fetched Profile:", profile);
    }
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err; // Throw error if needed
  }
};

module.exports = mongoDB;
