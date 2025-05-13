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
    const userId = req.user.id; // From JWT middleware

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid 6-digit OTP is required' 
      });
    }

    // Verify OTP
    const isValid = await otpService.verifyOTP(userId, otp, type);
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired OTP' 
      });
    }

    // Generate new long-lived token
    const token = generateToken(userId);
    
    res.json({ 
      success: true,
      token, // Send new token
      message: 'Account verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false,
      error: error.message || 'OTP verification failed'
    });
  }
};

// controllers/otpController.js
exports.requestOTPUnAuth = async (req, res) => {
  try {
    const { email, phone, type = 'email' } = req.body;

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ],
        is_verified: false // Only unverified users
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found or already verified' });
    }

    // Send OTP logic here (call your service)
    await otpService.sendOTP(user.id, user.email, user.phone, type);

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};