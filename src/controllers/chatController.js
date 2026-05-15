const prisma = require('../config/db');

const CHAT_INCLUDE = {
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, isOnline: true, lastSeen: true },
      },
    },
  },
  groupAdmin: {
    select: { id: true, name: true, email: true, avatar: true },
  },
  latestMessage: {
    include: { sender: { select: { name: true, avatar: true } } },
  },
};

// Flatten ChatMember join table so response has members as User[]
const formatChat = (chat) => ({
  ...chat,
  members: chat.members.map((m) => m.user),
});

// POST /api/chats  — access or create a 1-1 chat
const accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot create a chat with yourself' });
    }

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

    res.status(200).json({ chat: formatChat(chat) });
  } catch (error) {
    next(error);
  }
};

// GET /api/chats  — get all chats for logged-in user
const getMyChats = async (req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: CHAT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({ chats: chats.map(formatChat) });
  } catch (error) {
    next(error);
  }
};

// POST /api/chats/group  — create a group chat
const createGroup = async (req, res, next) => {
  try {
    const { groupName, members } = req.body;

    if (!groupName || !members || members.length < 2) {
      return res.status(400).json({ message: 'groupName and at least 2 members are required' });
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

    res.status(201).json({ chat: formatChat(chat) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/chats/group/add
const addMember = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    if (chat.groupAdminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the group admin can add members' });
    }

    const existing = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (existing) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { members: { create: { userId } } },
      include: CHAT_INCLUDE,
    });

    res.status(200).json({ chat: formatChat(updatedChat) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/chats/group/remove
const removeMember = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    if (chat.groupAdminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the group admin can remove members' });
    }

    if (chat.groupAdminId === userId) {
      return res.status(400).json({ message: 'Cannot remove the group admin' });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { members: { delete: { chatId_userId: { chatId, userId } } } },
      include: CHAT_INCLUDE,
    });

    res.status(200).json({ chat: formatChat(updatedChat) });
  } catch (error) {
    next(error);
  }
};

module.exports = { accessChat, getMyChats, createGroup, addMember, removeMember };
