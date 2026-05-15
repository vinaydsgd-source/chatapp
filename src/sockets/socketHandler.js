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
    const userName = socket.user.name;

    // Each user joins their own personal room so we can send direct signals
    socket.join(userId);

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

    socket.on('delete_message', async ({ messageId }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });

        if (!message) return socket.emit('error', { message: 'Message not found' });
        if (message.senderId !== userId) return socket.emit('error', { message: 'You can only delete your own messages' });

        await prisma.message.delete({ where: { id: messageId } });

        io.to(message.chatId).emit('message_deleted', { messageId, chatId: message.chatId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ─── WebRTC Voice / Video Call Signaling ─────────────────────────────────

    // Step 1: Caller notifies callee about incoming call
    // Emit: call:initiate  →  { targetUserId, callType: 'audio'|'video' }
    socket.on('call:initiate', ({ targetUserId, callType }) => {
      io.to(targetUserId).emit('call:incoming', {
        callerId: userId,
        callerName: userName,
        callType,           // 'audio' or 'video'
      });
    });

    // Step 2: Caller sends SDP offer to callee
    // Emit: call:offer  →  { targetUserId, offer }
    socket.on('call:offer', ({ targetUserId, offer }) => {
      io.to(targetUserId).emit('call:offer', { callerId: userId, offer });
    });

    // Step 3: Callee sends SDP answer back to caller
    // Emit: call:answer  →  { targetUserId, answer }
    socket.on('call:answer', ({ targetUserId, answer }) => {
      io.to(targetUserId).emit('call:answer', { calleeId: userId, answer });
    });

    // Step 4: Both sides exchange ICE candidates
    // Emit: call:ice-candidate  →  { targetUserId, candidate }
    socket.on('call:ice-candidate', ({ targetUserId, candidate }) => {
      io.to(targetUserId).emit('call:ice-candidate', { from: userId, candidate });
    });

    // Callee rejects the call
    // Emit: call:reject  →  { targetUserId }
    socket.on('call:reject', ({ targetUserId }) => {
      io.to(targetUserId).emit('call:rejected', { by: userId });
    });

    // Either side ends the call
    // Emit: call:end  →  { targetUserId }
    socket.on('call:end', ({ targetUserId }) => {
      io.to(targetUserId).emit('call:ended', { by: userId });
    });

    // ─────────────────────────────────────────────────────────────────────────

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
