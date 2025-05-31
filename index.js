const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Чтобы сервер принимал JSON в теле запроса
app.use(bodyParser.json());

// Разрешаем запросы с других доменов (настройка CORS)
app.use(cors());

// Простой маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.send('Привет! Сервер работает на Render!');
});

// Получаем порт из переменной окружения Render или ставим 3000 для локальной разработки
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
