import pool from '../db.js';

export const getUserChats = async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(`
      SELECT chats.id, chats.name
      FROM chats
      JOIN chat_members ON chats.id = chat_members.chat_id
      WHERE chat_members.user_id = $1
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
