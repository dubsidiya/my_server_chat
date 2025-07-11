const express = require('express');
const router = express.Router();
const pool = require('../db');
const { broadcastToChat } = require('../websocket');

// ✅ Отправить сообщение
router.post('/', async (req, res) => {
  const { chat_id, user_id, content } = req.body;

  if (!chat_id || !user_id || !content) {
    return res.status(400).json({ message: 'chat_id, user_id и content обязательны' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (chat_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, chat_id, user_id, content, created_at`,
      [chat_id, user_id, content]
    );

    // Получаем email отправителя
    const emailResult = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
    const senderEmail = emailResult.rows[0].email;

    const message = { ...result.rows[0], sender_email: senderEmail };

    // Рассылаем по WebSocket только участникам этого чата
    broadcastToChat(chat_id, message);

    res.status(201).json({ message: 'Сообщение отправлено', data: message });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ✅ Получить сообщения чата
router.get('/:chatId', async (req, res) => {
  const chatId = req.params.chatId;

  try {
    const result = await pool.query(`
      SELECT messages.id, messages.content, messages.created_at, users.email AS sender_email
      FROM messages
      JOIN users ON messages.user_id = users.id
      WHERE messages.chat_id = $1
      ORDER BY messages.created_at ASC
    `, [chatId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении сообщений:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
