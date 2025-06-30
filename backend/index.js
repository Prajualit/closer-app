import dotenv from "dotenv";
dotenv.config();
import mongoDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    const { chatId, message, sender, timestamp } = data;
    
    // Broadcast message to all users in the chat room
    io.to(chatId).emit('receive-message', {
      id: Date.now(),
      message,
      sender,
      timestamp,
      chatId
    });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', {
      userId: data.userId,
      username: data.username
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.chatId).emit('user-stop-typing', {
      userId: data.userId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoDB()
.then(() => {
  server.listen(process.env.PORT || 5000,() => {
    console.log(`Server is running on port ${process.env.PORT}`);
  })
})
.catch((error) => {
  console.log("MongoDB Failed to Connect", error)
})

