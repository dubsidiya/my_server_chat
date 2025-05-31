const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Имитация базы данных (в оперативной памяти)
const users = [];

// Корневой маршрут
app.get('/', (req, res) => {
  res.send('Привет! Сервер работает на Render!');
});

// 📌 Эндпоинт: Регистрация
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Проверка на существующего пользователя
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'Пользователь уже существует' });
  }

  users.push({ email, password });
  return res.status(201).json({ message: 'Регистрация успешна' });
});

// 📌 Эндпоинт: Логин
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(user => user.email === email && user.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  return res.status(200).json({ message: 'Вход выполнен успешно' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
