import express from 'express';
import { getMessages, sendMessage } from '../controllers/messagesController.js';

const router = express.Router();

router.get('/:chatId', getMessages);
router.post('/', sendMessage);

export default router;
