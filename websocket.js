const WebSocket = require('ws');
const clients = new Set();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('🟢 Новое соединение');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('🔴 Соединение закрыто');
    });
  });
}

function broadcastMessage(message) {
  const msgString = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msgString);
    }
  }
}

module.exports = { setupWebSocket, broadcastMessage };
