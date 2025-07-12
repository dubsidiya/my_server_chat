import pool from '../db.js';

export const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  try {
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, password]
    );

    return res.status(201).json({
      userId: result.rows[0].id,
      email: result.rows[0].email,
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error.message, error.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
