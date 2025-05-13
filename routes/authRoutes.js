const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, requireVerified } = require('../middlewares/authMiddleware');

// Debugging: Verify controller methods exist
console.log('Auth Controller Methods:', {
  register: typeof authController.register,
  login: typeof authController.login,
  logout: typeof authController.logout,
  getMe: typeof authController.getMe,
  updatePassword: typeof authController.updatePassword,
  verifyEmail: typeof authController.verifyEmail
});

// routes/authRoutes.js
// Add this route
router.post('/send-otp', protect, async (req, res) => {
  try {
    const { type = 'email' } = req.body;
    const userId = req.user.id;

    const otp = type === 'sms' 
      ? await otpService.sendSmsOTP(req.user.phone, userId, req.user.carrier)
      : await otpService.sendEmailOTP(req.user.email, userId);

    res.json({ 
      success: true,
      message: `OTP sent via ${type}`,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Public routes
router.post('/register', (req, res) => {
  console.log('Register route hit'); // Debugging
  authController.register(req, res);
});
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Protected routes
router.get('/me', protect, authController.getMe);
router.patch('/update-password', protect, requireVerified, authController.updatePassword);
router.post('/verify-email', protect, authController.verifyEmail);

module.exports = router;