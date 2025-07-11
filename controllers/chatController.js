const pool = require('../db');

exports.createPrivateChat = async (req, res) => {
  const { userId1, userId2 } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM chats WHERE is_group = false AND id IN (SELECT chat_id FROM chat_members WHERE user_id = $1) AND id IN (SELECT chat_id FROM chat_members WHERE user_id = $2)',
      [userId1, userId2]
    );

    if (existing.rows.length > 0) {
      return res.json({ chatId: existing.rows[0].id });
    }

    const newChat = await pool.query('INSERT INTO chats (is_group) VALUES (false) RETURNING id');
    await pool.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)', [
      newChat.rows[0].id, userId1, userId2,
    ]);

    res.json({ chatId: newChat.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка создания чата' });
  }
};

exports.createGroupChat = async (req, res) => {
  const { name, userIds } = req.body;

  try {
    const newChat = await pool.query('INSERT INTO chats (is_group, name) VALUES (true, $1) RETURNING id', [name]);

    const values = userIds.map(uid => `(${newChat.rows[0].id}, ${uid})`).join(',');
    await pool.query(`INSERT INTO chat_members (chat_id, user_id) VALUES ${values}`);

    res.json({ chatId: newChat.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка создания группы' });
  }
};

exports.getUserChats = async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await pool.query(`
      SELECT chats.id, chats.name, chats.is_group
      FROM chats
      JOIN chat_members ON chats.id = chat_members.chat_id
      WHERE chat_members.user_id = $1
    `, [userId]);

    res.json(chats.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения чатов' });
  }
};
