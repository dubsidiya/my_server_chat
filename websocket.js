import ws from 'ws';

const clients = new Map();

export const setupWebSocket = (server) => {
  const wss = new ws.Server({ server });

  wss.on('connection', (socket) => {
    socket.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'join' && data.chatId) {
          if (!clients.has(data.chatId)) clients.set(data.chatId, []);
          clients.get(data.chatId).push(socket);
        }
      } catch (e) {
        console.error('Ошибка разбора WebSocket-сообщения', e);
      }
    });

    socket.on('close', () => {
      for (const [chatId, sockets] of clients.entries()) {
        clients.set(chatId, sockets.filter((s) => s !== socket));
      }
    });
  });
};

export const broadcastMessage = (chatId, message) => {
  const receivers = clients.get(chatId) || [];
  for (const client of receivers) {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
};
