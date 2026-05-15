const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} = require('../utils/generateToken');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const USER_SELECT = { id: true, name: true, email: true, avatar: true };

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: USER_SELECT,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    res.cookie('refreshToken', refreshTokenValue, COOKIE_OPTIONS);
    res.status(201).json({ accessToken, user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    res.cookie('refreshToken', refreshTokenValue, COOKIE_OPTIONS);
    res.status(200).json({
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
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: tokenFromCookie } = req.cookies;

    if (!tokenFromCookie) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: tokenFromCookie } });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({ where: { token: tokenFromCookie } });
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = generateAccessToken(storedToken.userId);
    const newRefreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenValue,
        userId: storedToken.userId,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    res.cookie('refreshToken', newRefreshTokenValue, COOKIE_OPTIONS);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, logout, refreshToken };

