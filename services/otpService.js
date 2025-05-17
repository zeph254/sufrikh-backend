// services/otpService.js
const crypto = require('crypto');
const prisma = require('../prisma/client');
const emailService = require('./emailService');
const { sendSMS, CARRIER_GATEWAYS } = require('./smsService');

// Constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const SMS_MESSAGE_TEMPLATE = 'Your verification code is: {otp}. Valid for {minutes} minutes.';

// services/otpService.js
const generateOTP = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp; // Explicitly return a string
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
  return await prisma.$transaction(async (tx) => {
    // Invalidate any existing OTPs first
    await tx.oTP.updateMany({
      where: {
        user_id: userId,
        type: 'email',
        is_used: false
      },
      data: { is_used: true }
    });

    // Generate and store new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
    
    await tx.oTP.create({
      data: {
        user_id: userId,
        code: otp,
        type: 'email',
        expires_at: expiresAt,
        is_used: false
      }
    });

    // Send email
    await emailService.sendOTPEmail({
      email,
      otp,
      expirationMinutes: OTP_EXPIRY_MINUTES
    });

    return otp;
  });
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

const verifyOTP = async (userId, otp, type = 'email') => {
  // Ensure otp is a string and clean it
  const otpString = String(otp).trim();
  
  if (!otpString || otpString.length !== 6) {
    throw new Error('Valid 6-digit OTP is required');
  }

  return await prisma.$transaction(async (tx) => {
    // Find valid OTP
    const validOTP = await tx.oTP.findFirst({
      where: {
        user_id: userId,
        code: otpString, // Compare as string
        type,
        is_used: false,
        expires_at: { gt: new Date() }
      }
    });

    if (!validOTP) {
      await tx.failedOtpAttempt.create({
        data: {
          user_id: userId,
          attempted_code: otpString,
          attempt_type: type
        }
      });
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as used
    await tx.oTP.update({
      where: { id: validOTP.id },
      data: { 
        is_used: true,
        used_at: new Date()
      }
    });

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