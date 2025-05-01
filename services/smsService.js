// services/smsService.js
const nodemailer = require('nodemailer');

// Map of carriers to their SMS email domains
const CARRIER_GATEWAYS = Object.freeze({
  'att': 'txt.att.net',
  'verizon': 'vtext.com',
  'tmobile': 'tmomail.net',
  'sprint': 'messaging.sprintpcs.com',
  'uscellular': 'email.uscc.net',
  'virgin': 'vmobl.com',
  'boost': 'sms.myboostmobile.com',
  'cricket': 'sms.cricketwireless.net',
  'metropcs': 'mymetropcs.com',
  'googlefi': 'msg.fi.google.com',
  'mint': 'mailmymobile.net'
});

// Phone number validation regex
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/; // Allows international numbers

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Recommend using app password
  },
  // Add connection timeout
  connectionTimeout: 5000 
});

/**
 * Sends SMS via carrier's email-to-SMS gateway
 * @param {string} phoneNumber - Phone number (digits only, no formatting)
 * @param {string} carrier - Carrier key from CARRIER_GATEWAYS
 * @param {string} message - Message content (max 160 chars)
 * @returns {Promise<boolean>} - True if sent successfully
 * @throws {Error} - For invalid inputs or sending failures
 */
exports.sendSMS = async (phoneNumber, carrier, message) => {
  try {
    // Validate inputs
    if (!phoneNumber || !carrier || !message) {
      throw new Error('Missing required parameters');
    }

    if (!CARRIER_GATEWAYS[carrier]) {
      throw new Error(`Unsupported carrier: ${carrier}. Valid options: ${Object.keys(CARRIER_GATEWAYS).join(', ')}`);
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    if (message.length > 160) {
      console.warn('SMS message exceeds 160 character limit - may be truncated');
    }

    const smsEmail = `${phoneNumber}@${CARRIER_GATEWAYS[carrier]}`;
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: smsEmail,
      subject: '', // Required but empty
      text: message.slice(0, 160) // Ensure length limit
    });

    console.log(`SMS sent to ${phoneNumber} via ${carrier} gateway. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', {
      error: error.message,
      phoneNumber,
      carrier,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// Export carriers for reference in other modules
exports.CARRIER_GATEWAYS = CARRIER_GATEWAYS;