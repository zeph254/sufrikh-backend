const crypto = require('crypto');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');
const emailService = require('../services/emailService');

exports.forgotPassword = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpire
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail({
      email: user.email,
      resetUrl,
      name: user.first_name
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Hash the token to compare with DB
    const resetPasswordToken = req.params.token;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Update password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(req.body.password, 12),
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
};