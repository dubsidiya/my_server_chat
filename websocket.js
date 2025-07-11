import { WebSocketServer } from 'ws';
import pool from '../db.js';

const clients = new Map(); // userId -> ws

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const userId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('userId');
    if (!userId) return ws.close();

    clients.set(userId, ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'send') {
          const { chatId, senderId, content } = data;

          const result = await pool.query(`
            INSERT INTO messages (chat_id, sender_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, chat_id, sender_id, content, created_at
          `, [chatId, senderId, content]);

          const fullMessage = {
            ...result.rows[0],
            sender_email: data.senderEmail,
          };

          const members = await pool.query(
            'SELECT user_id FROM chat_members WHERE chat_id = $1',
            [chatId]
          );

          members.rows.forEach(row => {
            const client = clients.get(row.user_id.toString());
            if (client && client.readyState === 1) {
              client.send(JSON.stringify(fullMessage));
            }
          });
        }
      } catch (e) {
        console.error('Ошибка WebSocket:', e);
      }
    });

    ws.on('close', () => {
      clients.delete(userId);
    });
  });

  console.log('✅ WebSocket сервер запущен');
}
