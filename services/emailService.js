require('dotenv').config();
const nodemailer = require('nodemailer');
const { generateToken } = require('../utils/jwt');

// Email configuration with fail-safe defaults
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // Convert string to boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' // Only enforce in production
  },
  debug: process.env.NODE_ENV !== 'production', // Debug in non-production
  logger: true
});

// Cache for email templates
const emailTemplates = {
  invite: ({ role, inviterName, loginUrl }) => (`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #4299e1; padding: 20px; color: white;">
        <h1 style="margin: 0;">Sufrikh Account Invitation</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear User,</p>
        <p><strong>${inviterName}</strong> has invited you to join Sufrikh as a <strong>${role}</strong>.</p>
        
        <p>Your account has been successfully created. You can now log in using the password you set during registration.</p>
        
        <a href="${loginUrl}" 
           style="background: #4299e1; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Login to Your Account
        </a>
        
        <p style="margin-top: 30px; font-size: 14px; color: #718096;">
          If you didn't request this account, please contact our support team immediately.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 15px 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} Sufrikh. All rights reserved.
      </div>
    </div>
  `),
  
  verification: ({ verificationUrl }) => (`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3748;">Verify Your Email Address</h2>
      <p>Thank you for registering with Sufrikh!</p>
      
      <p>Please click the button below to verify your email address:</p>
      
      <a href="${verificationUrl}" 
         style="background: #4299e1; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        Verify Email
      </a>
      
      <p style="font-size: 14px; color: #718096;">
        This verification link will expire in 1 hour. If you didn't create an account, 
        please ignore this email or contact support if you have questions.
      </p>
    </div>
  `),
  
  passwordReset: ({ name, resetUrl }) => (`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #2563eb; padding: 20px; color: white;">
        <h1 style="margin: 0;">Sufrikh Password Reset</h1>
      </div>
      <div style="padding: 20px;">
        <p>Hello ${name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        
        <a href="${resetUrl}" 
           style="background: #2563eb; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; display: inline-block;
                  margin: 20px 0;">
          Reset Password
        </a>
        
        <p style="color: #6b7280; font-size: 0.9em;">
          This link will expire in 30 minutes. If you didn't request this, 
          please ignore this email or contact support.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 15px 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
        © ${new Date().getFullYear()} Sufrikh. All rights reserved.
      </div>
    </div>
  `)
};

// Email service methods
const sendInviteEmail = async ({ email, type, inviterName, loginUrl }) => {
  if (!email || !type || !inviterName || !loginUrl) {
    throw new Error('Missing required email parameters');
  }

  const roleTitles = {
    admin: 'Administrator',
    worker: 'Staff Member'
  };

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Sufrikh Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Sufrikh ${roleTitles[type]} Account Invitation`,
      html: emailTemplates.invite({
        role: roleTitles[type],
        inviterName,
        loginUrl
      })
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Dev Mode: Would send email with options:', mailOptions);
      return { previewUrl: 'https://mailtrap.io/inboxes' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Invite email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email delivery failed:', {
      error: err.message,
      stack: err.stack,
      recipient: email,
      time: new Date().toISOString()
    });
    throw new Error(`Failed to send invitation email: ${err.message}`);
  }
};

const sendVerificationEmail = async (email, userId) => {
  if (!email || !userId) {
    throw new Error('Missing required parameters for verification email');
  }

  try {
    const token = generateToken(userId, '1h');
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Sufrikh Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Sufrikh Account',
      html: emailTemplates.verification({ verificationUrl })
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Dev Mode: Verification email preview:', verificationUrl);
      return { previewUrl: verificationUrl };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Verification email failed:', {
      error: err.message,
      recipient: email,
      time: new Date().toISOString()
    });
    throw new Error(`Failed to send verification email: ${err.message}`);
  }
};

const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
    return true;
  } catch (err) {
    console.error('SMTP connection failed:', err);
    return false;
  }
};

const sendPasswordResetEmail = async ({ email, resetUrl, name }) => {
  try {
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Your Password Reset Request',
      html: emailTemplates.passwordReset({ name, resetUrl })
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Dev Mode: Would send password reset email with options:', mailOptions);
      return { previewUrl: resetUrl };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Password reset email failed:', err);
    throw err;
  }
};

module.exports = {
  sendInviteEmail,
  sendVerificationEmail,
  verifyConnection,
  sendPasswordResetEmail
};