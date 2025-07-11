import { Server } from 'ws';

const clients = new Map();

export const setupWebSocket = (server) => {
  const wss = new Server({ server });

  wss.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.type === 'join' && data.chatId) {
        if (!clients.has(data.chatId)) clients.set(data.chatId, []);
        clients.get(data.chatId).push(ws);
      }
    });

    ws.on('close', () => {
      for (const [chatId, sockets] of clients.entries()) {
        clients.set(chatId, sockets.filter((s) => s !== ws));
      }
    });
  });
};

export const broadcastMessage = (chatId, message) => {
  const receivers = clients.get(chatId) || [];
  for (const client of receivers) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }
};
