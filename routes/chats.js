import express from 'express';
import { getUserChats, createGroupChat } from '../controllers/chatController.js';

const router = express.Router();
router.get('/chats/:userId', getUserChats);
router.post('/chats', createGroupChat);
export default router;
