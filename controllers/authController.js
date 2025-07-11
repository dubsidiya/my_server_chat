const pool = require('../db');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT id FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    res.json({ userId: user.rows[0].id, email });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
