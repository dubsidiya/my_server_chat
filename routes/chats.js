import express from 'express';
import { getUserChats, createChat, deleteChat, getChatMembers, addMembersToChat } from '../controllers/chatsController.js';

const router = express.Router();

router.get('/:id', getUserChats);
router.post('/', createChat); // POST /chats (без /create)
router.delete('/:id', deleteChat); // DELETE /chats/:id
router.get('/:id/members', getChatMembers); // GET /chats/:id/members
router.post('/:id/members', addMembersToChat); // POST /chats/:id/members

export default router;
