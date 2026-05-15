const prisma = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudUpload');
const { getIO } = require('../config/socket');
const { ok, created, badRequest, notFound } = require('../utils/apiResponse');
const { MESSAGE } = require('../constants/messages');
const { MESSAGE_INCLUDE, IMAGE_MIME_TYPES, MESSAGE_PAGE_LIMIT, MESSAGE_PAGE_MAX } = require('../constants');

const getResourceType = (mimetype) => (IMAGE_MIME_TYPES.has(mimetype) ? 'image' : 'raw');

// POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId) return badRequest(res, MESSAGE.CHAT_ID_REQUIRED);
    if (req.fileRejected) return badRequest(res, MESSAGE.FILE_TYPE_NOT_ALLOWED);

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, members: { some: { userId: req.user.id } } },
    });
    if (!chat) return notFound(res, MESSAGE.CHAT_NOT_FOUND);

    let fileUrl = '';
    let fileName = '';
    let type = 'TEXT';

    if (req.file) {
      const resourceType = getResourceType(req.file.mimetype);
      const result = await uploadToCloudinary(req.file.buffer, 'chat-app/messages', resourceType);
      fileUrl = result.secure_url;
      fileName = req.file.originalname;
      type = req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE';
    }

    if (!content && !fileUrl) return badRequest(res, MESSAGE.CONTENT_OR_FILE_REQUIRED);

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

    const io = getIO();
    if (io) io.to(chatId).emit('message_received', message);
    return created(res, { message });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/:chatId?cursor=<messageId>&limit=50
// Opens a chat: fetches paginated messages + auto marks them as read
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || MESSAGE_PAGE_LIMIT, MESSAGE_PAGE_MAX);
    const cursor = req.query.cursor || null;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, members: { some: { userId: req.user.id } } },
    });
    if (!chat) return notFound(res, MESSAGE.CHAT_NOT_FOUND);

    // Fetch `limit` messages ending at cursor (or latest if no cursor)
    const messages = await prisma.message.findMany({
      where: {
        chatId,
        ...(cursor ? { createdAt: { lt: (await prisma.message.findUnique({ where: { id: cursor }, select: { createdAt: true } }))?.createdAt } } : {}),
      },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to detect hasMore
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop(); // remove the extra
    messages.reverse(); // return oldest → newest

    const nextCursor = hasMore ? messages[0].id : null;

    // Auto mark-as-read: messages in this chat not yet read by the logged-in user
    const unread = await prisma.message.findMany({
      where: {
        chatId,
        senderId: { not: req.user.id },
        NOT: { readBy: { some: { userId: req.user.id } } },
      },
      select: { id: true },
    });

    if (unread.length > 0) {
      await prisma.messageReadBy.createMany({
        data: unread.map((m) => ({ messageId: m.id, userId: req.user.id })),
        skipDuplicates: true,
      });
      const io = getIO();
      if (io) io.to(chatId).emit('read_receipt', { chatId, userId: req.user.id });
    }

    return ok(res, { messages, hasMore, nextCursor });
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

    const io = getIO();
    if (io) io.to(chatId).emit('read_receipt', { chatId, userId: req.user.id });
    return ok(res, { message: MESSAGE.MESSAGES_READ });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages, markAsRead };
