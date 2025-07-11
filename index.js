import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import messageRoutes from './routes/messages.js';
import { setupWebSocket } from './websocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(chatRoutes);
app.use(messageRoutes);

setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
