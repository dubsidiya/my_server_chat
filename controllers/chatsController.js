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

export async function createChat(req, res) {
  try {
    const { name, isGroup, members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Укажите участников чата' });
    }

    // Создаем чат
    const chatResult = await db.query(
      `INSERT INTO chats (name, is_group) VALUES ($1, $2) RETURNING id, name, is_group`,
      [name, isGroup]
    );

    const chat = chatResult.rows[0];
    const chatId = chat.id;

    // Добавляем участников (чтобы и создатель был в списке)
    // Например, если в members есть userId создателя, отлично.
    // Если нет — добавь его тоже.

    const insertMembersValues = members
      .map((_, i) => `($1, $${i + 2})`)
      .join(',');

    await db.query(
      `INSERT INTO chat_members (chat_id, user_id) VALUES ${insertMembersValues}`,
      [chatId, ...members]
    );

    res.status(201).json(chat);
  } catch (error) {
    console.error('Ошибка создания чата:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}