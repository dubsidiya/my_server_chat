import pool from '../db.js';

export const getMessages = async (req, res) => {
  const chatId = req.params.chatId;

  try {
    const result = await pool.query(`
      SELECT messages.*, users.email AS sender_email
      FROM messages
      JOIN users ON messages.sender_id = users.id
      WHERE messages.chat_id = $1
      ORDER BY messages.created_at ASC
    `, [chatId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const sendMessage = async (req, res) => {
  const { chatId, senderId, content } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO messages (chat_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, chat_id, sender_id, content, created_at
    `, [chatId, senderId, content]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
