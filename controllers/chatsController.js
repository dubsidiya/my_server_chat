import pool from '../db.js'; // твой модуль подключения к PostgreSQL

export const createChat = async (req, res) => {
  try {
    const { name, userId, memberIds } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ message: "Укажите имя чата и userId" });
    }

    // Если на клиенте memberIds не переданы → создаём чат только с создателем
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

    return res.status(200).json({
      id: chatId,
      name,
      is_group: members.length > 1
    });

  } catch (e) {
    console.error("Ошибка createChat:", e);
    res.status(500).json({ message: "Ошибка создания чата" });
  }
};
