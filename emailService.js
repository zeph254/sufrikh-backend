const nodemailer = require('nodemailer');
const { generateToken } = require('./jwt');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerificationEmail = async (email, userId) => {
  const token = generateToken(userId, '1h'); // Short-lived token
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    to: email,
    subject: 'Verify Your Sufrikh Account',
    html: `Click <a href="${verificationUrl}">here</a> to verify your email.`
  });
};