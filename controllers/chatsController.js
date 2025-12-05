import pool from '../db.js';

// Получение всех чатов пользователя
export const getUserChats = async (req, res) => {
  try {
    const userId = req.params.id;

    // Используем chat_users (как в схеме БД) вместо chat_members
    const result = await pool.query(
      `SELECT c.id, c.name, c.is_group
       FROM chats c
       JOIN chat_users cu ON c.id = cu.chat_id
       WHERE cu.user_id = $1`,
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
    // Приложение отправляет: { name, userIds: [userId1, userId2, ...] }
    const { name, userIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Укажите имя чата" });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Укажите хотя бы одного участника (userIds)" });
    }

    // Определяем, групповой ли чат (больше 1 участника)
    const isGroup = userIds.length > 1;

    // Создаём чат с is_group
    const chatResult = await pool.query(
      `INSERT INTO chats (name, is_group) VALUES ($1, $2) RETURNING id, name, is_group`,
      [name, isGroup]
    );

    const chatId = chatResult.rows[0].id;

    // Добавляем участников в chat_users (как в схеме БД)
    for (const userId of userIds) {
      await pool.query(
        `INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)`,
        [chatId, userId]
      );
    }

    // Возвращаем 201 (Created) как ожидает приложение
    res.status(201).json({
      id: chatId,
      name: chatResult.rows[0].name,
      is_group: chatResult.rows[0].is_group
    });

  } catch (error) {
    console.error("Ошибка createChat:", error);
    res.status(500).json({ message: "Ошибка создания чата" });
  }
};

// Удаление чата
export const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;

    if (!chatId) {
      return res.status(400).json({ message: "Укажите ID чата" });
    }

    // Проверяем, существует ли чат
    const chatCheck = await pool.query(
      'SELECT id FROM chats WHERE id = $1',
      [chatId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ message: "Чат не найден" });
    }

    // Удаляем чат (каскадное удаление удалит связанные записи в chat_users и messages)
    await pool.query('DELETE FROM chats WHERE id = $1', [chatId]);

    res.status(200).json({ message: "Чат успешно удален" });

  } catch (error) {
    console.error("Ошибка deleteChat:", error);
    res.status(500).json({ message: "Ошибка удаления чата" });
  }
};

// Получение участников чата
export const getChatMembers = async (req, res) => {
  try {
    const chatId = req.params.id;

    const result = await pool.query(
      `SELECT u.id, u.email
       FROM users u
       JOIN chat_users cu ON u.id = cu.user_id
       WHERE cu.chat_id = $1`,
      [chatId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка getChatMembers:", error);
    res.status(500).json({ message: "Ошибка получения участников чата" });
  }
};

// Добавление участников в чат
export const addMembersToChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Укажите хотя бы одного участника (userIds)" });
    }

    // Проверяем, существует ли чат
    const chatCheck = await pool.query(
      'SELECT id FROM chats WHERE id = $1',
      [chatId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ message: "Чат не найден" });
    }

    // Добавляем участников (пропускаем, если уже есть)
    const addedUsers = [];
    for (const userId of userIds) {
      try {
        // Проверяем, не является ли пользователь уже участником
        const existing = await pool.query(
          'SELECT 1 FROM chat_users WHERE chat_id = $1 AND user_id = $2',
          [chatId, userId]
        );

        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)`,
            [chatId, userId]
          );
          addedUsers.push(userId);
        }
      } catch (e) {
        console.error(`Ошибка при добавлении пользователя ${userId}:`, e);
        // Продолжаем добавлять остальных
      }
    }

    // Обновляем is_group, если участников стало больше 1
    const memberCount = await pool.query(
      'SELECT COUNT(*) as count FROM chat_users WHERE chat_id = $1',
      [chatId]
    );
    const count = parseInt(memberCount.rows[0].count);
    
    if (count > 1) {
      await pool.query(
        'UPDATE chats SET is_group = true WHERE id = $1',
        [chatId]
      );
    }

    res.status(200).json({
      message: "Участники успешно добавлены",
      addedCount: addedUsers.length
    });

  } catch (error) {
    console.error("Ошибка addMembersToChat:", error);
    res.status(500).json({ message: "Ошибка добавления участников" });
  }
};
