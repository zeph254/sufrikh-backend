// controllers/otpController.js
const otpService = require('../services/otpService');
const prisma = require('../prisma/client');

exports.requestOTP = async (req, res) => {
  try {
    const { type = 'email' } = req.body;
    const userId = req.user.id;

    // Verify user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        phone: true,
        carrier: true,
        is_verified: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if already verified
    if (user.is_verified && type === 'email') {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    let otp;
    if (type === 'sms') {
      if (!user.phone || !user.carrier) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number and carrier not registered' 
        });
      }
      otp = await otpService.sendSmsOTP(user.phone, userId, user.carrier);
    } else {
      otp = await otpService.sendEmailOTP(user.email, userId);
    }

    res.json({ 
      success: true,
      message: `OTP sent via ${type}`,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('OTP request failed:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      type: req.body?.type,
      timestamp: new Date().toISOString()
    });

    const statusCode = error.message.includes('rate limit') ? 429 : 500;
    res.status(statusCode).json({ 
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
};

// controllers/otpController.js
exports.verifyOTP = async (req, res) => {
  try {
    const { otp, type = 'email' } = req.body;
    const userId = req.user.id;

    const isValid = await otpService.verifyOTP(userId, otp, type);

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired OTP' 
      });
    }

    res.json({ 
      success: true,
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('OTP verification failed:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message || 'Failed to verify OTP'
    });
  }
};