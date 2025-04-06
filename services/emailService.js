// services/emailService.js
const nodemailer = require('nodemailer');
const { generateToken } = require('../utils/jwt');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendInviteEmail = async ({ email, tempPassword, type, inviterName }) => {
  const roleTitles = {
    admin: 'Administrator',
    worker: 'Staff Member'
  };

  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  try {
    await transporter.sendMail({
      to: email,
      subject: `Your Sufrikh ${roleTitles[type]} Account Invitation`,
      html: `
        <p>Dear User,</p>
        <p>You've been invited by ${inviterName} to join Sufrikh as a ${roleTitles[type]}.</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please login at <a href="${loginUrl}">${loginUrl}</a> and change your password immediately.</p>
        <p>If you didn't request this, please contact support immediately.</p>
        <br>
        <p>Best regards,</p>
        <p>The Sufrikh Team</p>
      `
    });
  } catch (err) {
    console.error('Failed to send invite email:', err);
    throw new Error('Failed to send email');
  }
};

exports.sendVerificationEmail = async (email, userId) => {
  const token = generateToken(userId, '1h');
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      to: email,
      subject: 'Verify Your Sufrikh Account',
      html: `
        <p>Please click the link below to verify your email:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p>This link will expire in 1 hour.</p>
      `
    });
  } catch (err) {
    console.error('Failed to send verification email:', err);
    throw new Error('Failed to send verification email');
  }
};