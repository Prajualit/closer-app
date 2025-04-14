import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { upload } from "./middleware/multer.middleware.js";

const app = express();

app.use(cors({ 
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
}));

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/temp", express.static("temp"));

// Routes
import userRouter from "./Routes/user.routes.js";
app.use("/api/v1/users", userRouter);


export { app };