// middlewares/rateLimit.js
const rateLimit = require('express-rate-limit');

const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per window
  message: 'Too many OTP requests from this IP, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many OTP requests. Please try again in 15 minutes.'
    });
  },
  skipSuccessfulRequests: true
});

module.exports = { otpRateLimiter };