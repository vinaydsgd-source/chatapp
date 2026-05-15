const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');

const errorMiddleware = (err, req, res, next) => {
  // Prisma unique constraint violation
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  // Prisma record not found
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ message });
};

module.exports = errorMiddleware;
