const express = require('express');
const {
  accessChat,
  getMyChats,
  createGroup,
  addMember,
  removeMember,
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: One-to-one and group chat management
 */

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Access or create a one-to-one chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The other user's ID
 *                 example: clx1abc123
 *     responses:
 *       200:
 *         description: Existing or newly created 1-1 chat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all chats for the logged-in user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chats sorted by last activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').post(accessChat).get(getMyChats);

/**
 * @swagger
 * /api/chats/group:
 *   post:
 *     summary: Create a new group chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groupName, members]
 *             properties:
 *               groupName:
 *                 type: string
 *                 example: Team Alpha
 *               members:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: string
 *                 example: ["clx1abc123", "clx1def456"]
 *     responses:
 *       201:
 *         description: Group chat created. Creator is automatically added as admin.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/group', createGroup);

/**
 * @swagger
 * /api/chats/group/add:
 *   put:
 *     summary: Add a member to a group chat (admin only)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, userId]
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: clx2chat456
 *               userId:
 *                 type: string
 *                 example: clx1ghi789
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/group/add', addMember);

/**
 * @swagger
 * /api/chats/group/remove:
 *   put:
 *     summary: Remove a member from a group chat (admin only)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, userId]
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: clx2chat456
 *               userId:
 *                 type: string
 *                 example: clx1ghi789
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/group/remove', removeMember);

module.exports = router;
