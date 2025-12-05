import pool from '../db.js';

// Получение всех чатов пользователя
export const getUserChats = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      `SELECT c.id, c.name
       FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE cm.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка getUserChats:", error);
    res.status(500).json({ message: "Ошибка получения чатов" });
  }
};

// Создание чата
export const createChat = async (req, res) => {
  try {
    const { name, userIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Укажите имя чата" });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Укажите хотя бы одного участника" });
    }

    // Создаём чат
    const chatResult = await pool.query(
      `INSERT INTO chats (name) VALUES ($1) RETURNING id, name`,
      [name]
    );

    const chatId = chatResult.rows[0].id;

    // Добавляем участников в chat_members
    for (const userId of userIds) {
      await pool.query(
        `INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)`,
        [chatId, userId]
      );
    }

    res.status(201).json({
      id: chatId,
      name: chatResult.rows[0].name
    });

  } catch (error) {
    console.error("Ошибка createChat:", error);
    res.status(500).json({ message: "Ошибка создания чата" });
  }
};
