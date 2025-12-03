import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import http from 'http';
import dns from 'dns';

// Принудительно используем IPv4 для DNS резолвинга (решает проблему с Render и IPv6)
dns.setDefaultResultOrder('ipv4first');

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import messageRoutes from './routes/messages.js';
import { setupWebSocket } from './websocket/websocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/messages', messageRoutes);

// Подключение WebSocket
setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
