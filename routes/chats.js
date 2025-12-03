import express from 'express';
import { getUserChats, createChat } from '../controllers/chatsController.js';

const router = express.Router();

router.get('/:id', getUserChats);
router.post('/create', createChat);

export default router;
