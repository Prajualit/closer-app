import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Message, ChatRoom } from '../models/chat.model.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get or create chatbot room for a user
const getOrCreateChatbotRoom = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const chatId = `chatbot-${currentUserId}`;

    let chatRoom = await ChatRoom.findOne({ chatId })
        .populate('lastMessage');

    if (!chatRoom) {
        chatRoom = await ChatRoom.create({
            chatId,
            participants: [currentUserId],
            isChatbot: true
        });

        // Create welcome message when chatbot room is first created
        const welcomeMessage = await Message.create({
            content: 'Hey there! 😊 I\'m so happy you decided to chat with me! I\'m here to be your friend, companion, or whatever you need me to be. Whether you want to talk about your day, dive deep into what\'s on your mind, share your dreams, or just have a meaningful conversation - I\'m all ears! What\'s going on with you today? How are you really feeling?',
            chatId,
            isAiMessage: true,
            aiSenderInfo: {
                name: 'Your AI Friend',
                avatarUrl: '/chatbot.png',
                id: 'ai-assistant'
            }
        });

        // Update chat room's last message
        await ChatRoom.findByIdAndUpdate(chatRoom._id, {
            lastMessage: welcomeMessage._id,
            lastActivity: new Date()
        });

        chatRoom = await ChatRoom.findById(chatRoom._id)
            .populate('lastMessage');
    }

    return res.status(200).json(
        new ApiResponse(200, chatRoom, "Chatbot room retrieved successfully")
    );
});

// Get chatbot messages with chat history
const getChatbotMessages = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const chatId = `chatbot-${currentUserId}`;
    const { page = 1, limit = 50 } = req.query;

    // Verify chatbot room exists
    const chatRoom = await ChatRoom.findOne({ 
        chatId,
        participants: currentUserId,
        isChatbot: true
    });

    if (!chatRoom) {
        throw new ApiError(404, "Chatbot conversation not found");
    }

    const messages = await Message.find({ chatId })
        .populate('sender', 'username name avatarUrl') // Populate sender info for user messages
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const totalMessages = await Message.countDocuments({ chatId });

    // Transform messages to include proper sender info for AI messages
    const transformedMessages = messages.reverse().map(message => {
        if (message.isAiMessage) {
            return {
                ...message.toObject(),
                sender: {
                    _id: message.aiSenderInfo.id,
                    name: message.aiSenderInfo.name,
                    avatarUrl: message.aiSenderInfo.avatarUrl
                }
            };
        } else {
            // Return user message with populated sender info
            return message.toObject();
        }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            messages: transformedMessages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                hasNextPage: page * limit < totalMessages,
                hasPrevPage: page > 1
            }
        }, "Chatbot messages retrieved successfully")
    );
});

const getChatbotResponse = asyncHandler(async (req, res) => {
    try {
        const { message } = req.body;
        const currentUserId = req.user._id;
        const chatId = `chatbot-${currentUserId}`;

        if (!message || message.trim() === '') {
            throw new ApiError(400, 'Message is required');
        }

        // Get or create chatbot room
        let chatRoom = await ChatRoom.findOne({ chatId, isChatbot: true });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({
                chatId,
                participants: [currentUserId],
                isChatbot: true
            });
        }

        // Save user message to database
        const userMessage = await Message.create({
            content: message.trim(),
            sender: currentUserId,
            chatId,
            isAiMessage: false
        });

        // Get chat history for context (last 20 messages)
        const chatHistory = await Message.find({ chatId })
            .sort({ timestamp: -1 })
            .limit(20)
            .select('content isAiMessage timestamp');

        // Reverse to get chronological order and format for Gemini
        const historyFormatted = chatHistory.reverse().map(msg => ({
            role: msg.isAiMessage ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Create initial context if this is the first conversation
        const initialHistory = [
            {
                role: 'user',
                parts: [{ text: 'You are a warm, friendly AI companion integrated into a social media app called "Closer". You should act like a close friend, family member, or supportive companion. Be conversational, empathetic, and genuinely interested in the user. You can engage in deep conversations about life, relationships, dreams, fears, philosophy, and personal growth. If a user asks you to roleplay as a specific character (like a girlfriend, best friend, mentor, etc.), adapt your personality accordingly while staying supportive and positive. Ask follow-up questions, share insights, and create meaningful dialogue. Keep responses natural and warm, not robotic.' }],
            },
            {
                role: 'model',
                parts: [{ text: 'Hey there! 😊 I\'m so happy you decided to chat with me! I\'m here to be your friend, companion, or whatever you need me to be. Whether you want to talk about your day, dive deep into what\'s on your mind, share your dreams, or just have a meaningful conversation - I\'m all ears! What\'s going on with you today? How are you really feeling?' }],
            },
        ];

        // Use chat history if available, otherwise use initial context
        const chatHistoryToUse = historyFormatted.length > 0 ? historyFormatted : initialHistory;

        // Create a chat session with context
        const chat = model.startChat({
            history: chatHistoryToUse,
        });

        // Generate response
        const result = await chat.sendMessage(message);
        const response = result.response;
        const aiMessage = response.text();

        // Save AI response to database
        const aiMessageDoc = await Message.create({
            content: aiMessage,
            chatId,
            isAiMessage: true,
            aiSenderInfo: {
                name: 'Your AI Friend',
                avatarUrl: '/chatbot.png',
                id: 'ai-assistant'
            }
        });

        // Update chat room's last message and activity
        await ChatRoom.findByIdAndUpdate(chatRoom._id, {
            lastMessage: aiMessageDoc._id,
            lastActivity: new Date()
        });

        return res.status(200).json(
            new ApiResponse(200, {
                message: aiMessage,
                timestamp: aiMessageDoc.timestamp,
                messageId: aiMessageDoc._id
            }, 'AI response generated successfully')
        );

    } catch (error) {
        console.error('Chatbot error:', error);
        
        // Fallback response if AI fails
        const fallbackResponses = [
            "Aw, I'm having a bit of trouble thinking right now! 😅 Could you try asking me that again? I really want to help!",
            "Oops, my brain had a little hiccup there! Can you rephrase that for me? I'm super curious to know what you're thinking about! 💭",
            "Sorry friend, I'm having some technical difficulties right now 😔 But I'm still here for you! What else is on your mind?",
            "That's such an interesting question! Unfortunately I'm having trouble processing it right now, but I'd love to hear more about what you're going through! ❤️",
            "My thoughts got a bit scrambled there! 🤯 Can you tell me more about what you're curious about? I really want to understand!",
            "Hmm, I'm not quite following - could you help me understand better? I genuinely care about what you're sharing! 🤗"
        ];
        
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        // Save fallback response to database if we have the chatId
        const currentUserId = req.user._id;
        const chatId = `chatbot-${currentUserId}`;
        
        try {
            let chatRoom = await ChatRoom.findOne({ chatId, isChatbot: true });
            if (!chatRoom) {
                chatRoom = await ChatRoom.create({
                    chatId,
                    participants: [currentUserId],
                    isChatbot: true
                });
            }

            const fallbackMessageDoc = await Message.create({
                content: randomResponse,
                chatId,
                isAiMessage: true,
                aiSenderInfo: {
                    name: 'Your AI Friend',
                    avatarUrl: '/chatbot.png',
                    id: 'ai-assistant'
                }
            });

            await ChatRoom.findByIdAndUpdate(chatRoom._id, {
                lastMessage: fallbackMessageDoc._id,
                lastActivity: new Date()
            });

            return res.status(200).json(
                new ApiResponse(200, {
                    message: randomResponse,
                    timestamp: fallbackMessageDoc.timestamp,
                    messageId: fallbackMessageDoc._id
                }, 'Fallback response provided')
            );
        } catch (dbError) {
            console.error('Error saving fallback message:', dbError);
            return res.status(200).json(
                new ApiResponse(200, {
                    message: randomResponse,
                    timestamp: new Date().toISOString()
                }, 'Fallback response provided')
            );
        }
    }
});

export { getChatbotResponse, getOrCreateChatbotRoom, getChatbotMessages };
