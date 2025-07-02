import dotenv from "dotenv";
dotenv.config();
import mongoDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { initializeSocket } from "./utils/socket.js";

const server = createServer(app);

// Initialize Socket.IO with authentication and notification support
const io = initializeSocket(server);

// Additional chat-specific Socket.IO handlers
io.on('connection', (socket) => {
  // Join a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.user.username} joined chat ${chatId}`);
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

