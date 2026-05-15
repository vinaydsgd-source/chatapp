const prisma = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudUpload');
const { ok, created, badRequest } = require('../utils/apiResponse');
const { UPLOAD } = require('../constants/messages');
const { IMAGE_MIME_TYPES } = require('../constants');

const getResourceType = (mimetype) => (IMAGE_MIME_TYPES.has(mimetype) ? 'image' : 'raw');

// POST /api/upload
const uploadFile = async (req, res, next) => {
  try {
    if (req.fileRejected) return badRequest(res, UPLOAD.FILE_TYPE_NOT_ALLOWED);
    if (!req.file)         return badRequest(res, UPLOAD.NO_FILE);

    const resourceType = getResourceType(req.file.mimetype);

    // Upload to Cloudinary with the correct resource type
    const result = await uploadToCloudinary(req.file.buffer, 'chat-app/uploads', resourceType);

    // Persist upload record
    const upload = await prisma.upload.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format || null,
        bytes: result.bytes || null,
        userId: req.user.id,
      },
    });

    return created(res, {
      message: UPLOAD.UPLOAD_SUCCESS,
      upload: {
        id: upload.id,
        url: upload.url,
        publicId: upload.publicId,
        format: upload.format,
        bytes: upload.bytes,
        createdAt: upload.createdAt,
      },
    });
  } catch (error) {
    console.error('[uploadFile]', error.message || error);
    next(error);
  }
};

// GET /api/upload/my — list uploads for the logged-in user
const getMyUploads = async (req, res, next) => {
  try {
    const uploads = await prisma.upload.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, { uploads });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, getMyUploads };
