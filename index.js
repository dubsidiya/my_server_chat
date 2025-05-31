const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let users = [];
let messages = [];

// Регистрация
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Пользователь уже существует' });
  }
  users.push({ email, password });
  res.json({ message: 'Регистрация успешна' });
});

// Вход
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ error: 'Неверный email или пароль' });
  }
  res.json({ message: 'Вход успешен' });
});

// Отправка сообщения
app.post('/messages', (req, res) => {
  const { from, to, text } = req.body;
  messages.push({ from, to, text, date: new Date() });
  res.json({ message: 'Сообщение отправлено' });
});

// Получение сообщений
app.get('/messages', (req, res) => {
  res.json(messages);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
