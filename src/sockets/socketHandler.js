const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const socketHandler = (io) => {
  // Authenticate socket connection via access token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;

    // Mark user online
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
    io.emit('online_status', { userId, isOnline: true });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
    });

    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', { chatId, userId });
    });

    socket.on('stop_typing', (chatId) => {
      socket.to(chatId).emit('stop_typing', { chatId, userId });
    });

    socket.on('mark_read', ({ chatId }) => {
      socket.to(chatId).emit('read_receipt', { chatId, userId });
    });

    socket.on('disconnect', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });
      io.emit('online_status', { userId, isOnline: false, lastSeen: new Date() });
    });
  });
};

module.exports = socketHandler;
