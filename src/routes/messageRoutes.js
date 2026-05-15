const express = require('express');
const { sendMessage, getMessages, markAsRead, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Send, retrieve, and mark messages as read
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message (text or file)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [chatId]
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: clx2chat456
 *               content:
 *                 type: string
 *                 example: Hello there!
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Optional image or file (max 10 MB)
 *     responses:
 *       201:
 *         description: Message sent. Also emitted to chat room via socket (message_received).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', upload.single('file'), sendMessage);

/**
 * @swagger
 * /api/messages/{chatId}:
 *   get:
 *     summary: Get messages for a chat (paginated) — call on chat open
 *     description: |
 *       Call this when the user clicks/opens a chat. Returns the latest messages
 *       and **automatically marks all unread messages as read** (emits `read_receipt` via socket).
 *
 *       **Pagination (infinite scroll / load more):**
 *       - First load: `GET /api/messages/:chatId` — returns the latest 50 messages
 *       - Load older: `GET /api/messages/:chatId?cursor=<nextCursor>` — returns 50 messages before the cursor
 *       - Stop loading when `hasMore` is `false`
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         example: clx2chat456
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *         description: Message ID to paginate backwards from (use `nextCursor` from previous response)
 *         example: clx3msg001
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of messages to return (max 100)
 *     responses:
 *       200:
 *         description: Paginated messages, oldest → newest. Unread messages are auto-marked as read.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 hasMore:
 *                   type: boolean
 *                   description: True if older messages exist — use nextCursor to fetch them
 *                   example: true
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Pass as `cursor` in the next request to load older messages
 *                   example: clx3msg001
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:chatId', getMessages);

/**
 * @swagger
 * /api/messages/read/{chatId}:
 *   put:
 *     summary: Mark all unread messages in a chat as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat
 *         example: clx2chat456
 *     responses:
 *       200:
 *         description: Messages marked as read. Also emits read_receipt via socket.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Messages marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/read/:chatId', markAsRead);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a message (sender only)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message deleted
 *                 messageId:
 *                   type: string
 *       403:
 *         description: Not your message
 *       404:
 *         description: Message not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:messageId', deleteMessage);

module.exports = router;
