import pool from '../db.js'; // твой модуль подключения к PostgreSQL

export const getUserChats = async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT c.id, c.name,
              CASE WHEN COUNT(cm2.user_id) > 2 THEN true ELSE false END AS is_group
       FROM chats c
       JOIN chat_members cm ON cm.chat_id = c.id
       LEFT JOIN chat_members cm2 ON cm2.chat_id = c.id
       WHERE cm.user_id = $1
       GROUP BY c.id`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении чатов' });
  }
};

export const createChat = async (req, res) => {
  const { name, userIds } = req.body; // name - название чата, userIds - массив id участников
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Укажите участников чата' });
  }

  try {
    // Создаем чат (название может быть null для личных чатов)
    const chatResult = await pool.query(
      'INSERT INTO chats (name) VALUES ($1) RETURNING id, name',
      [name || null]
    );
    const chat = chatResult.rows[0];

    // Добавляем участников в chat_members
    const insertPromises = userIds.map(userId =>
      pool.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)', [
        chat.id,
        userId,
      ])
    );
    await Promise.all(insertPromises);

    res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не удалось создать чат' });
  }
};
