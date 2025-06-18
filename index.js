require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Сервер работает с PostgreSQL!');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
    res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    res.status(200).json({ userId: userCheck.rows[0].id });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/messages', async (req, res) => {
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ message: 'user_id и content обязательны' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO messages (user_id, content) VALUES ($1, $2) RETURNING *',
      [user_id, content]
    );
    res.status(201).json({ message: 'Сообщение добавлено', data: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при добавлении сообщения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT messages.id, messages.content, messages.created_at, users.email AS sender_email
      FROM messages
      JOIN users ON messages.user_id = users.id
      ORDER BY messages.created_at ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении сообщений' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
