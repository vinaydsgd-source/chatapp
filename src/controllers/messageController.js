const prisma = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudUpload');
const { getIO } = require('../config/socket');

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, avatar: true } },
  readBy: { select: { userId: true } },
};

// POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    if (req.fileRejected) {
      return res.status(400).json({ message: 'File type not allowed' });
    }

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, members: { some: { userId: req.user.id } } },
    });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    let fileUrl = '';
    let fileName = '';
    let type = 'TEXT';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      fileUrl = result.secure_url;
      fileName = req.file.originalname;
      type = req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE';
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Message content or file is required' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        chatId,
        content: content || '',
        type,
        fileUrl,
        fileName,
        readBy: { create: { userId: req.user.id } },
      },
      include: MESSAGE_INCLUDE,
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { latestMessageId: message.id },
    });

    getIO().to(chatId).emit('message_received', message);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/:chatId
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, members: { some: { userId: req.user.id } } },
    });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

// PUT /api/messages/read/:chatId
const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const unreadMessages = await prisma.message.findMany({
      where: {
        chatId,
        NOT: { readBy: { some: { userId: req.user.id } } },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.messageReadBy.createMany({
        data: unreadMessages.map((m) => ({ messageId: m.id, userId: req.user.id })),
        skipDuplicates: true,
      });
    }

    getIO().to(chatId).emit('read_receipt', { chatId, userId: req.user.id });
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages, markAsRead };
