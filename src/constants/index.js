/**
 * Shared DB projections, config objects, and app-wide constants.
 * Keeps controllers DRY — import from here instead of redefining.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Prisma select / include objects ─────────────────────────────────────────

const USER_SELECT = {
  id:        true,
  name:      true,
  email:     true,
  avatar:    true,
  isOnline:  true,
  lastSeen:  true,
  createdAt: true,
};

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

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, avatar: true } },
  readBy: { select: { userId: true } },
};

// ─── File upload ──────────────────────────────────────────────────────────────

/** MIME types treated as Cloudinary `image` resource type (viewable inline) */
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/** All MIME types accepted by the upload middleware */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/** Max upload size in bytes (10 MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Max messages per page */
const MESSAGE_PAGE_LIMIT = 50;

/** Hard cap on messages per page */
const MESSAGE_PAGE_MAX = 100;

module.exports = {
  COOKIE_OPTIONS,
  USER_SELECT,
  CHAT_INCLUDE,
  MESSAGE_INCLUDE,
  IMAGE_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MESSAGE_PAGE_LIMIT,
  MESSAGE_PAGE_MAX,
};
