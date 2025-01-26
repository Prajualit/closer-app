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

    // Access the 'users' and 'profiles' collections
    const fetched_user = mongoose.connection.db.collection("users");
    const fetched_profile = mongoose.connection.db.collection("profiles");

    // Fetch one profile
    const profile = await fetched_profile.findOne({});

    if (profile) {
      // Find the user where the username matches the profile's username
      const matchingUser = await fetched_user.findOne({
        username : profile.username,
      });

      if (matchingUser) {
        console.log("Matching Profile:", profile);
        console.log("Matching User:", matchingUser);

        global.profile = profile;
        global.user = matchingUser;
      } else {
        console.log("No matching user found for the profile.");
        return null;
      }
    } else {
      console.log("No profiles found.");
      return null;
    }
  } catch (err) {
    console.error("Error connecting to MongoDB or fetching data:", err);
    throw err;
  }
};

module.exports = mongoDB;
