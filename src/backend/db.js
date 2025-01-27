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
    const fetchedUserCollection = mongoose.connection.db.collection("users");
    const fetchedProfileCollection = mongoose.connection.db.collection("profiles");

    // Fetch one profile
    const profile = await fetchedProfileCollection.findOne({});
    if (!profile || !profile.username) {
      console.log("No valid profile found or profile does not contain a username.");
      return null;
    }

    // Find the user with a matching username
    const matchingUser = await fetchedUserCollection.findOne({
      username: profile.username,
    });

    if (matchingUser) {
      console.log("Matching Profile:", profile);
      console.log("Matching User:", matchingUser);

      // Save to globals
      global.profile = profile;
      global.user = matchingUser;

      return { profile, user: matchingUser }; // Return the result for further use if needed
    } else {
      console.log(`No matching user found for the username: ${profile.username}`);
      return null;
    }
  } catch (err) {
    console.error("Error connecting to MongoDB or fetching data:", err);
    throw err; // Rethrow the error for upstream handling
  }
};

module.exports = mongoDB;
