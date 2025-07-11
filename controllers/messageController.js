const pool = require('../db');
const { broadcastMessage } = require('../websocket');

exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await pool.query(`
      SELECT messages.*, users.email AS sender_email
      FROM messages
      JOIN users ON messages.user_id = users.id
      WHERE messages.chat_id = $1
      ORDER BY messages.created_at
    `, [chatId]);

    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения сообщений' });
  }
};

exports.sendMessage = async (req, res) => {
  const { chat_id, user_id, content } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [chat_id, user_id, content]
    );

    const fullMsg = await pool.query(`
      SELECT messages.*, users.email AS sender_email
      FROM messages
      JOIN users ON messages.user_id = users.id
      WHERE messages.id = $1
    `, [result.rows[0].id]);

    broadcastMessage(fullMsg.rows[0]);
    res.status(201).json(fullMsg.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка отправки сообщения' });
  }
};
