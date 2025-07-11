const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ Создать личный чат (если его ещё нет)
router.post('/private', async (req, res) => {
  const { user1_id, user2_id } = req.body;

  try {
    const existing = await pool.query(`
      SELECT chat_id
      FROM chat_members
      WHERE user_id = $1
      INTERSECT
      SELECT chat_id
      FROM chat_members
      WHERE user_id = $2
    `, [user1_id, user2_id]);

    if (existing.rows.length > 0) {
      return res.json({ chatId: existing.rows[0].chat_id });
    }

    const newChat = await pool.query(
      'INSERT INTO chats (is_group) VALUES (FALSE) RETURNING id'
    );

    const chatId = newChat.rows[0].id;

    await pool.query(`
      INSERT INTO chat_members (chat_id, user_id)
      VALUES ($1, $2), ($1, $3)
    `, [chatId, user1_id, user2_id]);

    res.status(201).json({ chatId });
  } catch (e) {
    console.error('Ошибка создания личного чата:', e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ✅ Создать групповой чат
router.post('/group', async (req, res) => {
  const { name, user_ids } = req.body;

  try {
    const chat = await pool.query(
      'INSERT INTO chats (name, is_group) VALUES ($1, TRUE) RETURNING id',
      [name]
    );

    const chatId = chat.rows[0].id;

    const values = user_ids.map((uid, i) => `($1, $${i + 2})`).join(',');
    await pool.query(
      `INSERT INTO chat_members (chat_id, user_id) VALUES ${values}`,
      [chatId, ...user_ids]
    );

    res.status(201).json({ chatId });
  } catch (e) {
    console.error('Ошибка создания группового чата:', e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ✅ Получить все чаты пользователя
router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.is_group, c.created_at
      FROM chats c
      JOIN chat_members cm ON cm.chat_id = c.id
      WHERE cm.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (e) {
    console.error('Ошибка получения чатов:', e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
