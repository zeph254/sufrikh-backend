const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const emailService = require('../services/emailService');

// Forgot Password - Generate and send reset token


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found with that email' });
    }

    // 2. Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    // 3. Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetPasswordToken: resetToken,
        resetPasswordExpire: resetTokenExpiry
      }
    });

    // 4. Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail({
      email: user.email,
      name: user.first_name,
      resetUrl
    });

    res.status(200).json({ 
      success: true, 
      message: 'Password reset email sent' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process password reset',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Find user by token and check expiry
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpire: { gt: new Date() } // Token not expired
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Update password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};