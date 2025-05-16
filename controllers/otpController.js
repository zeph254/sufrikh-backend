// controllers/otpController.js
const otpService = require('../services/otpService');
const prisma = require('../prisma/client');

exports.requestOTP = async (req, res) => {
  try {
    const { type = 'email' } = req.body;
    const userId = req.user.id;

    // Add rate limiting check at the controller level
// Update the time window to be more user-friendly
    const recentOTP = await prisma.oTP.findFirst({
      where: {
        user_id: userId,
        type,
        created_at: { gt: new Date(Date.now() - 60000) }, // 60 seconds ago
        is_used: false
      }
    });

    if (recentOTP) {
      const secondsLeft = Math.ceil((new Date(recentOTP.created_at).getTime() + 60000 - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${secondsLeft} seconds before requesting another OTP`
      });
    }

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
// controllers/otpController.js
// controllers/otpController.js
exports.verifyOTP = async (req, res) => {
  try {
    const { otp, type = 'email' } = req.body;
    const userId = req.user.id;

    // Ensure otp is a string
    const otpString = String(otp).trim();
    
    if (!otpString || otpString.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid 6-digit OTP is required' 
      });
    }

    // Verify OTP using your OTP service
    const isValid = await otpService.verifyOTP(userId, otpString, type);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired OTP' 
      });
    }

    // Update user verification status if needed
    if (type === 'email') {
      await prisma.user.update({
        where: { id: userId },
        data: { is_verified: true }
      });
    }

    // Generate new token
    const token = generateToken(userId);

    res.json({ 
      success: true,
      token,
      message: 'Account verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
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