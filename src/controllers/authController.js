const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } = require('../utils/generateToken');
const { ok, created, badRequest, unauthorized, conflict } = require('../utils/apiResponse');
const { AUTH } = require('../constants/messages');
const { COOKIE_OPTIONS } = require('../constants');

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return badRequest(res, AUTH.ALL_FIELDS_REQUIRED);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return conflict(res, AUTH.EMAIL_IN_USE);

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, avatar: true },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    res.cookie('refreshToken', refreshTokenValue, COOKIE_OPTIONS);
    return created(res, { message: AUTH.SIGNUP_SUCCESS, accessToken, user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return badRequest(res, AUTH.ALL_FIELDS_REQUIRED);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return unauthorized(res, AUTH.INVALID_CREDENTIALS);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    res.cookie('refreshToken', refreshTokenValue, COOKIE_OPTIONS);
    return ok(res, {
      message: AUTH.LOGIN_SUCCESS,
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie('refreshToken');
    return ok(res, { message: AUTH.LOGOUT_SUCCESS });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: tokenFromCookie } = req.cookies;
    if (!tokenFromCookie) return unauthorized(res, AUTH.REFRESH_TOKEN_MISSING);

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: tokenFromCookie } });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({ where: { token: tokenFromCookie } });
      res.clearCookie('refreshToken');
      return unauthorized(res, AUTH.REFRESH_TOKEN_INVALID);
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = generateAccessToken(storedToken.userId);
    const newRefreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: { token: newRefreshTokenValue, userId: storedToken.userId, expiresAt: getRefreshTokenExpiry() },
    });

    res.cookie('refreshToken', newRefreshTokenValue, COOKIE_OPTIONS);
    return ok(res, { accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return badRequest(res, AUTH.EMAIL_REQUIRED);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always 200 to prevent email enumeration
    if (!user) return ok(res, { message: AUTH.FORGOT_PASSWORD_SENT });

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${plainToken}`;

    // TODO: In production send via email (nodemailer/SendGrid). Remove token from response.
    return ok(res, {
      message: AUTH.FORGOT_PASSWORD_SUCCESS,
      resetToken: plainToken, // ← remove in production
      resetUrl,               // ← remove in production
      expiresIn: '1 hour',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) return badRequest(res, AUTH.RESET_FIELDS_REQUIRED);
    if (newPassword.length < 6)  return badRequest(res, AUTH.PASSWORD_TOO_SHORT);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: { resetToken: hashedToken, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) return badRequest(res, AUTH.RESET_TOKEN_INVALID);

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return ok(res, { message: AUTH.RESET_PASSWORD_SUCCESS });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, logout, refreshToken, forgotPassword, resetPassword };
