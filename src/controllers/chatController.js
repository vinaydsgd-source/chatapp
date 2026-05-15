const prisma = require('../config/db');
const { ok, created, badRequest, forbidden, notFound, conflict } = require('../utils/apiResponse');
const { CHAT } = require('../constants/messages');
const { CHAT_INCLUDE } = require('../constants');

// Flatten ChatMember join table so response has members as User[]
const formatChat = (chat) => ({
  ...chat,
  members: chat.members.map((m) => m.user),
});

// POST /api/chats  — access or create a 1-1 chat
const accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) return badRequest(res, CHAT.USER_ID_REQUIRED);
    if (userId === req.user.id) return badRequest(res, CHAT.SELF_CHAT);

    let chat = await prisma.chat.findFirst({
      where: {
        isGroupChat: false,
        AND: [
          { members: { some: { userId: req.user.id } } },
          { members: { some: { userId } } },
        ],
      },
      include: CHAT_INCLUDE,
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          isGroupChat: false,
          members: {
            createMany: { data: [{ userId: req.user.id }, { userId }] },
          },
        },
        include: CHAT_INCLUDE,
      });
    }

    return ok(res, { chat: formatChat(chat) });
  } catch (error) {
    next(error);
  }
};

// GET /api/chats  — get all chats for logged-in user (sidebar / inbox)
const getMyChats = async (req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: CHAT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    const formattedChats = chats.map(formatChat);

    // Enrich each chat with unreadCount + chatWith (parallel, avoids N+1 waterfall)
    const enriched = await Promise.all(
      formattedChats.map(async (chat) => {
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: req.user.id },                          // ignore own messages
            NOT: { readBy: { some: { userId: req.user.id } } },     // not yet read by me
          },
        });

        // For 1-1 chats expose the other participant directly
        const chatWith = chat.isGroupChat
          ? null
          : chat.members.find((m) => m.id !== req.user.id) ?? null;

        return { ...chat, unreadCount, chatWith };
      })
    );

    res.status(200).json({ chats: enriched });
  } catch (error) {
    next(error);
  }
};

// POST /api/chats/group  — create a group chat
const createGroup = async (req, res, next) => {
  try {
    const { groupName, members } = req.body;

    if (!groupName || !members || members.length < 2) {
      return badRequest(res, CHAT.GROUP_NAME_MEMBERS_REQUIRED);
    }

    const allMemberIds = [...new Set([...members, req.user.id])];

    const chat = await prisma.chat.create({
      data: {
        isGroupChat: true,
        groupName,
        groupAdminId: req.user.id,
        members: {
          createMany: { data: allMemberIds.map((id) => ({ userId: id })) },
        },
      },
      include: CHAT_INCLUDE,
    });

    return created(res, { chat: formatChat(chat) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/chats/group/add
const addMember = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || !chat.isGroupChat) return notFound(res, CHAT.GROUP_NOT_FOUND);
    if (chat.groupAdminId !== req.user.id) return forbidden(res, CHAT.ADMIN_ONLY_ADD);

    const existing = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (existing) return conflict(res, CHAT.ALREADY_MEMBER);

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { members: { create: { userId } } },
      include: CHAT_INCLUDE,
    });

    return ok(res, { chat: formatChat(updatedChat) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/chats/group/remove
const removeMember = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || !chat.isGroupChat) return notFound(res, CHAT.GROUP_NOT_FOUND);
    if (chat.groupAdminId !== req.user.id) return forbidden(res, CHAT.ADMIN_ONLY_REMOVE);
    if (chat.groupAdminId === userId) return badRequest(res, CHAT.CANNOT_REMOVE_ADMIN);

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { members: { delete: { chatId_userId: { chatId, userId } } } },
      include: CHAT_INCLUDE,
    });

    return ok(res, { chat: formatChat(updatedChat) });
  } catch (error) {
    next(error);
  }
};

module.exports = { accessChat, getMyChats, createGroup, addMember, removeMember };
