import express from 'express';
import { getUserChats, createChat } from '../controllers/chatsController.js';

const router = express.Router();

router.get('/:id', getUserChats);
router.post('/', createChat); // POST /chats (без /create)

export default router;
