const prisma = require('../config/db');
const { ok } = require('../utils/apiResponse');
const { USER_SELECT } = require('../constants');

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const { password, ...user } = req.user;
    return ok(res, { user });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/search?q=
const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || '';

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: USER_SELECT,
    });

    return ok(res, { users });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatar },
      select: USER_SELECT,
    });

    return ok(res, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, searchUsers, updateProfile };

