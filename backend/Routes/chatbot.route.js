import { Router } from 'express';
import { getChatbotResponse } from '../controllers/chatbot.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Chatbot routes
router.route('/message').post(getChatbotResponse);

export default router;
