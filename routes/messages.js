import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';

const router = express.Router();
router.get('/messages/:chatId', getMessages);
router.post('/messages', sendMessage);
export default router;
