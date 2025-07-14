import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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
import createRouter from "./Routes/create.route.js";
import chatRouter from "./Routes/chat.route.js";
import notificationRouter from "./Routes/notification.route.js";
import postsRouter from "./Routes/posts.route.js";
import chatbotRouter from "./Routes/chatbot.route.js";
import fixUrlsRouter from "./Routes/fix-urls.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1", createRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/chatbot", chatbotRouter);
app.use("/api/v1/fix", fixUrlsRouter);


export { app };