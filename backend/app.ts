// @ts-ignore
import express, { urlencoded } from "express";
// @ts-ignore
import cors from "cors";
// @ts-ignore
import cookieParser from "cookie-parser";

const app = express();

// CORS configuration to handle multiple origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ["http://localhost:3000"];

app.use(cors({ 
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
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