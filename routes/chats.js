const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/private', chatController.createPrivateChat);
router.post('/group', chatController.createGroupChat);
router.get('/:userId', chatController.getUserChats);

module.exports = router;
