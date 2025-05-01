// middlewares/dbConnection.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    await prisma.$connect();
    req.prisma = prisma; // Attach to request
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      success: false,
      error: 'Service unavailable. Database connection failed.'
    });
  } finally {
    await prisma.$disconnect();
  }
};