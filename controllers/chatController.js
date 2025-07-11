import pool from '../db.js';

export const getUserChats = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query(
      `SELECT chats.id, chats.name
       FROM chats
       JOIN chat_members ON chats.id = chat_members.chat_id
       WHERE chat_members.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения чатов' });
  }
};

export const createGroupChat = async (req, res) => {
  const { name, memberIds } = req.body;
  try {
    const chatResult = await pool.query(
      'INSERT INTO chats (name) VALUES ($1) RETURNING id',
      [name]
    );
    const chatId = chatResult.rows[0].id;
    for (const id of memberIds) {
      await pool.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)', [chatId, id]);
    }
    res.status(201).json({ chatId });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка создания чата' });
  }
};
