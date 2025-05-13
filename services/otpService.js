// services/otpService.js
const crypto = require('crypto');
const prisma = require('../prisma/client');
const emailService = require('./emailService');
const { sendSMS, CARRIER_GATEWAYS } = require('./smsService');

// Constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const SMS_MESSAGE_TEMPLATE = 'Your verification code is: {otp}. Valid for {minutes} minutes.';

const generateOTP = () => {
  const digits = [];
  for (let i = 0; i < OTP_LENGTH; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  return digits.join('');
};

const storeOTP = async (userId, otp, type = 'email') => {
  const prisma = require('../prisma/client');
  
  try {
    // Ensure connection
    await prisma.$connect();

    // Invalidate existing OTPs first - use transaction for atomicity
    const result = await prisma.$transaction([
      prisma.oTP.updateMany({
        where: {
          user_id: userId,
          type,
          is_used: false,
          expires_at: { gt: new Date() } // Only invalidate unexpired OTPs
        },
        data: { is_used: true }
      }),
      prisma.oTP.create({
        data: {
          user_id: userId,
          code: otp.toString(), // Ensure string storage
          type,
          expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000),
          is_used: false
        }
      })
    ]);

    return result[1]; // Return the created OTP
  } catch (error) {
    console.error('OTP storage failed:', error);
    throw new Error('Failed to store OTP');
  } finally {
    await prisma.$disconnect();
  }
};

const sendEmailOTP = async (email, userId) => {
  try {
    const otp = generateOTP();
    await storeOTP(userId, otp, 'email');
    
    await emailService.sendOTPEmail({
      email,
      otp,
      expirationMinutes: OTP_EXPIRY_MINUTES
    });
    
    return otp;
  } catch (error) {
    console.error('Email OTP failed:', {
      error: error.message,
      email,
      userId,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to send OTP email');
  }
};

const sendSmsOTP = async (phoneNumber, userId, carrier) => {
  try {
    if (!CARRIER_GATEWAYS[carrier]) {
      throw new Error(`Unsupported carrier: ${carrier}`);
    }

    const otp = generateOTP();
    await storeOTP(userId, otp, 'sms');

    const message = SMS_MESSAGE_TEMPLATE
      .replace('{otp}', otp)
      .replace('{minutes}', OTP_EXPIRY_MINUTES);

    await sendSMS(phoneNumber, carrier, message);
    return otp;
  } catch (error) {
    console.error('SMS OTP failed:', {
      error: error.message,
      phoneNumber,
      userId,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to send SMS OTP');
  }
};

// services/otpService.js
const verifyOTP = async (userId, otp, type = 'email') => {
  return await prisma.$transaction(async (tx) => {
    // 1. Find valid OTP
    const validOTP = await tx.oTP.findFirst({
      where: {
        user_id: userId,
        code: otp.toString(),
        type,
        is_used: false,
        expires_at: { gt: new Date() }
      }
    });

    if (!validOTP) {
      await tx.failedOtpAttempt.create({
        data: {
          user_id: userId,
          attempted_code: otp.toString(),
          attempt_type: type
        }
      });
      throw new Error('Invalid or expired OTP');
    }

    // 2. Mark OTP as used
    await tx.oTP.update({
      where: { id: validOTP.id },
      data: { 
        is_used: true,
        used_at: new Date()
      }
    });

    // 3. Update user verification status
    if (type === 'email') {
      await tx.user.update({
        where: { id: userId },
        data: { is_verified: true }
      });
    }

    return true;
  });
};

module.exports = {
  generateOTP,
  storeOTP,
  sendEmailOTP,
  sendSmsOTP,
  verifyOTP,
  constants: {
    OTP_LENGTH,
    OTP_EXPIRY_MINUTES,
    CARRIER_GATEWAYS
  }
};