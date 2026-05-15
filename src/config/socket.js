const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  return io;
};

/**
 * Returns the Socket.io instance, or null in serverless mode.
 * Callers must guard: const io = getIO(); if (io) io.emit(...)
 */
const getIO = () => io || null;

module.exports = { initSocket, getIO };
