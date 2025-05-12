import dotenv from "dotenv";
dotenv.config();
import mongoDB from "./db/index.js";
import { app } from "./app.js";


mongoDB()
.then(() => {
  app.listen(process.env.PORT || 5000,() => {
    console.log(`Server is running on port ${process.env.PORT}`);
  })
})
.catch((error) => {
  console.log("MongoDB Failed to Connect", error)
})

