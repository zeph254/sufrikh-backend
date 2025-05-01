// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      code: err.code
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};