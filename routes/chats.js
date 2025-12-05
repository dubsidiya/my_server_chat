import express from 'express';
import { getUserChats, createChat, deleteChat } from '../controllers/chatsController.js';

const router = express.Router();

router.get('/:id', getUserChats);
router.post('/', createChat); // POST /chats (без /create)
router.delete('/:id', deleteChat); // DELETE /chats/:id

export default router;
