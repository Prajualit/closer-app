# Chat System Documentation

## Overview

This chat system has been integrated into your project using Socket.IO for real-time messaging. Users can chat with each other by visiting the `/[username]/chat` route (e.g., `/prajualit/chat`).

## Features

### Real-time Messaging
- ✅ Instant message delivery using Socket.IO
- ✅ Real-time typing indicators
- ✅ Message persistence in MongoDB
- ✅ Chat room management

### Chat Interface
- ✅ Responsive design (mobile-friendly)
- ✅ Chat list sidebar showing all conversations
- ✅ User search to start new conversations
- ✅ Message timestamps
- ✅ User avatars and profiles

### Backend API Endpoints

All chat endpoints require authentication (`verifyJWT` middleware):

- `GET /api/v1/chat/rooms` - Get user's chat rooms
- `GET /api/v1/chat/room/:participantId` - Get or create chat room with another user
- `GET /api/v1/chat/messages/:chatId` - Get messages from a specific chat (with pagination)
- `POST /api/v1/chat/message` - Save a message to database
- `GET /api/v1/users/search?query=searchterm` - Search for users to start new chats

### Socket.IO Events

#### Client → Server Events:
- `join-chat` - Join a specific chat room
- `send-message` - Send a message to a chat room
- `typing` - Indicate user is typing
- `stop-typing` - Indicate user stopped typing

#### Server → Client Events:
- `receive-message` - Receive a new message
- `user-typing` - Another user is typing
- `user-stop-typing` - Another user stopped typing

## Database Models

### Message Model
```javascript
{
    content: String,        // Message content
    sender: ObjectId,       // Reference to User
    chatId: String,         // Chat room identifier
    timestamp: Date,        // Message timestamp
    edited: Boolean,        // If message was edited
    editedAt: Date         // Edit timestamp
}
```

### ChatRoom Model
```javascript
{
    chatId: String,         // Unique chat identifier
    participants: [ObjectId], // Array of User references
    lastMessage: ObjectId,  // Reference to last Message
    lastActivity: Date      // Last activity timestamp
}
```

## File Structure

### Frontend Components
- `src/components/Chat/ChatInterface.jsx` - Main chat interface
- `src/components/Chat/ChatList.jsx` - Chat rooms list and user search
- `src/lib/SocketContext.js` - Socket.IO context provider
- `src/components/ui/scroll-area.jsx` - Scroll area component
- `src/app/[username]/chat/page.jsx` - Chat page route

### Backend Components
- `src/backend/controllers/chat.controller.js` - Chat API endpoints
- `src/backend/models/chat.model.js` - Database models
- `src/backend/Routes/chat.route.js` - Chat routes
- `src/backend/index.js` - Socket.IO server setup

## Usage Instructions

1. **Start a New Chat:**
   - Go to `/[username]/chat`
   - Search for a user in the search box
   - Click on a user to start a new conversation

2. **Send Messages:**
   - Type in the message input field
   - Press Enter or click the Send button
   - Messages are delivered instantly via Socket.IO and saved to database

3. **View Conversations:**
   - All your conversations appear in the left sidebar
   - Click on any conversation to view messages
   - See real-time typing indicators when others are typing

## Development Notes

- The Socket.IO server runs on port 5000 alongside the Express API
- The frontend connects to the Socket.IO server automatically when a user is logged in
- Chat rooms are identified by a combination of participant IDs (sorted alphabetically)
- All messages are persisted in MongoDB for message history
- The system is fully responsive and works on mobile devices

## Environment Setup

Make sure these packages are installed:
- Frontend: `socket.io-client`
- Backend: `socket.io`

The chat system is now fully functional and ready to use!
