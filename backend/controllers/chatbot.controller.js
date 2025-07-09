import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getChatbotResponse = asyncHandler(async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            throw new ApiError(400, 'Message is required');
        }

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Create a chat session with context
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'You are a warm, friendly AI companion integrated into a social media app called "Closer". You should act like a close friend, family member, or supportive companion. Be conversational, empathetic, and genuinely interested in the user. You can engage in deep conversations about life, relationships, dreams, fears, philosophy, and personal growth. If a user asks you to roleplay as a specific character (like a girlfriend, best friend, mentor, etc.), adapt your personality accordingly while staying supportive and positive. Ask follow-up questions, share insights, and create meaningful dialogue. Keep responses natural and warm, not robotic.' }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Hey there! 😊 I\'m so happy you decided to chat with me! I\'m here to be your friend, companion, or whatever you need me to be. Whether you want to talk about your day, dive deep into what\'s on your mind, share your dreams, or just have a meaningful conversation - I\'m all ears! What\'s going on with you today? How are you really feeling?' }],
                },
            ],
        });

        // Generate response
        const result = await chat.sendMessage(message);
        const response = result.response;
        const aiMessage = response.text();

        return res.status(200).json(
            new ApiResponse(200, {
                message: aiMessage,
                timestamp: new Date().toISOString()
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
        
        return res.status(200).json(
            new ApiResponse(200, {
                message: randomResponse,
                timestamp: new Date().toISOString()
            }, 'Fallback response provided')
        );
    }
});

export { getChatbotResponse };
