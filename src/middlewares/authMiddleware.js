const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { unauthorized } = require('../utils/apiResponse');
const { USER } = require('../constants/messages');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, USER.NOT_AUTHORIZED_NO_TOKEN);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return unauthorized(res, USER.USER_NOT_FOUND);

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, USER.TOKEN_EXPIRED);
    }
    return unauthorized(res, USER.NOT_AUTHORIZED_INVALID);
  }
};

module.exports = { protect };
