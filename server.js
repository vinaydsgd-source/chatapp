require('dotenv').config();
const http = require('http');

const app = require('./src/app');
const { initSocket } = require('./src/config/socket');
const socketHandler = require('./src/sockets/socketHandler');

const httpServer = http.createServer(app);

// Socket.io — only available in traditional (non-serverless) deployment
const io = initSocket(httpServer);
socketHandler(io);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const SERVER_IP = process.env.SERVER_IP || 'localhost';

httpServer.listen(PORT, HOST, () => {
  console.log(`\nServer running on http://${SERVER_IP}:${PORT}`);
  console.log(`\n  Local:   http://localhost:${PORT}/api/docs`);
  console.log(`  Network: http://${SERVER_IP}:${PORT}/api/docs  ← share this with FE team\n`);
});

