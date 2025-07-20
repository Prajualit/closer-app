
import dotenv from "dotenv";
dotenv.config();
import mongoDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { initializeSocket } from "./utils/socket.js";
import fs from "fs";
import path from "path";
import { Server, Socket } from "socket.io";

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("✅ Created temp directory:", tempDir);
}

const server = createServer(app);

// Initialize Socket.IO with authentication and notification support
const io = initializeSocket(server);


// Types for chat events
interface ChatMessageData {
  chatId: string;
  message: string;
  sender: {
    _id: string;
    username: string;
    [key: string]: any;
  };
  timestamp: number | string;
}

interface TypingData {
  chatId: string;
  userId: string;
  username: string;
}

interface StopTypingData {
  chatId: string;
  userId: string;
}

// Add user property to Socket type
declare module "socket.io" {
  interface Socket {
    user?: {
      _id: string;
      username: string;
      [key: string]: any;
    };
  }
}

// Chat-specific Socket.IO handlers
io.on("connection", (socket: Socket) => {
  // Join a chat room
  socket.on("join-chat", (chatId: string) => {
    socket.join(chatId);
    const username = socket.user?.username || "unknown";
    console.log(`User ${username} joined chat ${chatId}`);
  });

  // Handle sending messages
  socket.on("send-message", (data: ChatMessageData) => {
    const { chatId, message, sender, timestamp } = data;
    io.to(chatId).emit("receive-message", {
      id: Date.now(),
      message,
      sender,
      timestamp,
      chatId,
    });
  });

  // Handle typing indicators
  socket.on("typing", (data: TypingData) => {
    socket.to(data.chatId).emit("user-typing", {
      userId: data.userId,
      username: data.username,
    });
  });

  socket.on("stop-typing", (data: StopTypingData) => {
    socket.to(data.chatId).emit("user-stop-typing", {
      userId: data.userId,
    });
  });
});

mongoDB()
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Failed to Connect", error);
  });
