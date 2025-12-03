import pool from '../db.js';

// Получение всех чатов пользователя
export const getUserChats = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      `SELECT c.id, c.name, c.is_group
       FROM chats c
       JOIN chat_members m ON c.id = m.chat_id
       WHERE m.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (e) {
    console.error("Ошибка getUserChats:", e);
    res.status(500).json({ message: "Ошибка получения чатов" });
  }
};

// Создание чата
export const createChat = async (req, res) => {
  try {
    const { name, userId, memberIds } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ message: "Укажите имя чата и userId" });
    }

    // Если участников нет → создаём чат только с создателем
    const members = Array.isArray(memberIds) && memberIds.length > 0
      ? memberIds
      : [userId];

    const chatResult = await pool.query(
      `INSERT INTO chats (name, is_group) VALUES ($1, $2) RETURNING id`,
      [name, members.length > 1]
    );

    const chatId = chatResult.rows[0].id;

    // Добавляем участников
    for (const memberId of members) {
      await pool.query(
        `INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)`,
        [chatId, memberId]
      );
    }

    res.status(200).json({
      id: chatId,
      name,
      is_group: members.length > 1
    });

  } catch (e) {
    console.error("Ошибка createChat:", e);
    res.status(500).json({ message: "Ошибка создания чата" });
  }
};
