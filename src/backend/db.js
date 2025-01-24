const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongoDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, ()=> {
    if (err) {
      console.log('Error', err);
  } else {
      console.log('Connected');
      const fetched_user = mongoose.connection.db.collection("users");
      fetched_user.findOne({}).toArray(async function (err, data) {
        const user = await data;
          return user;
      })
    }
  });
};

module.exports = mongoDB;