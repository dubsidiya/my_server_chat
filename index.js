require('dotenv').config(); // Загружаем .env переменные

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Корневой маршрут
app.get('/', (req, res) => {
  res.send('Привет! Сервер работает с PostgreSQL!');
});

// 📌 Эндпоинт: Регистрация
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);

    return res.status(201).json({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// 📌 Эндпоинт: Логин
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    return res.status(200).json({ message: 'Вход выполнен успешно' });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});
// 📌 Эндпоинт: Отправка сообщения
app.post('/send', async (req, res) => {
  const { sender, content } = req.body;

  if (!sender || !content) {
    return res.status(400).json({ message: 'Отсутствуют поля sender или content' });
  }

  try {
    await pool.query('INSERT INTO messages (sender, content) VALUES ($1, $2)', [sender, content]);
    return res.status(201).json({ message: 'Сообщение отправлено' });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    return res.status(500).json({ message: 'Ошибка сервера при отправке сообщения' });
  }
});

// 📌 Эндпоинт: Получение всех сообщений
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at ASC');
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    return res.status(500).json({ message: 'Ошибка сервера при получении сообщений' });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
