const express = require('express');
const { sendMessage, getMessages, markAsRead } = require('../controllers/messageController');
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
 *     summary: Get all messages in a chat
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
 *         description: List of messages ordered oldest → newest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
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

module.exports = router;
