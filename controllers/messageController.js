import pool from '../db.js';
import { broadcastMessage } from '../websocket.js';

export const getMessages = async (req, res) => {
  const chatId = req.params.chatId;
  try {
    const result = await pool.query(
      `SELECT m.id, m.content, m.created_at, u.email AS sender_email
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at`,
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения сообщений' });
  }
};

export const sendMessage = async (req, res) => {
  const { chatId, userId, content } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO messages (chat_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING id, content, created_at`,
      [chatId, userId, content]
    );
    const sender = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);

    const fullMessage = {
      id: result.rows[0].id,
      content: result.rows[0].content,
      createdAt: result.rows[0].created_at,
      senderEmail: sender.rows[0].email,
      chatId,
    };

    broadcastMessage(chatId, fullMessage);
    res.status(201).json(fullMessage);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка отправки сообщения' });
  }
};
