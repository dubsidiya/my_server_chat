import express from 'express';
import { getUserChats } from '../controllers/chatsController.js';

const router = express.Router();

router.get('/:userId', getUserChats);

export default router;
