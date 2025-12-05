import pool from '../db.js';

export const getMessages = async (req, res) => {
  const chatId = req.params.chatId;

  try {
    // Используем user_id (как в схеме БД) вместо sender_id
    const result = await pool.query(`
      SELECT 
        messages.id,
        messages.chat_id,
        messages.user_id,
        messages.content,
        messages.created_at,
        users.email AS sender_email
      FROM messages
      JOIN users ON messages.user_id = users.id
      WHERE messages.chat_id = $1
      ORDER BY messages.created_at ASC
    `, [chatId]);

    // Форматируем в формат, который ожидает приложение
    const formattedMessages = result.rows.map(row => ({
      id: row.id,
      chat_id: row.chat_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      sender_email: row.sender_email
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const sendMessage = async (req, res) => {
  // Приложение отправляет: { user_id, chat_id, content }
  const { user_id, chat_id, content } = req.body;

  if (!user_id || !chat_id || !content) {
    return res.status(400).json({ message: 'Укажите user_id, chat_id и content' });
  }

  try {
    // Используем user_id (как в схеме БД) вместо sender_id
    const result = await pool.query(`
      INSERT INTO messages (chat_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, chat_id, user_id, content, created_at
    `, [chat_id, user_id, content]);

    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [user_id]
    );

    const message = result.rows[0];
    const response = {
      id: message.id,
      chat_id: message.chat_id,
      user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      sender_email: userResult.rows[0]?.email || ''
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
