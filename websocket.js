const WebSocket = require('ws');
const clients = new Map(); // client => { userId, chatIds }

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw);
        // ожидание { userId, chatIds: [1,2,3] }
        clients.set(ws, { userId: data.userId, chatIds: data.chatIds });
      } catch (e) {
        console.error('Неверный WebSocket payload:', e);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  function broadcastToChat(chatId, message) {
    const json = JSON.stringify(message);
    for (const [client, info] of clients.entries()) {
      if (info.chatIds.includes(chatId)) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
    }
  }

  return { wss, broadcastToChat };
}

module.exports = setupWebSocket;
