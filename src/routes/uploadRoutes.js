const express = require('express');
const { uploadFile, getMyUploads } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File uploads — upload docs/images to Cloudinary and get back a URL
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file to Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image or document (JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, TXT — max 10 MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 upload:
 *                   $ref: '#/components/schemas/Upload'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', protect, upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/upload/my:
 *   get:
 *     summary: List all files uploaded by the logged-in user
 *     tags: [Upload]
 *     responses:
 *       200:
 *         description: List of uploads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Upload'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', protect, getMyUploads);

module.exports = router;
