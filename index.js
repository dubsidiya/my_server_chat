require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { setupWebSocket } = require('./websocket');

app.use(cors());
app.use(bodyParser.json());

// маршруты
app.use('/auth', require('./routes/auth'));
app.use('/chats', require('./routes/chats'));
app.use('/messages', require('./routes/messages'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

// Запускаем WebSocket
setupWebSocket(server);
