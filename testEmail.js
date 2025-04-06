// testEmail.js
require('dotenv').config();
const emailService = require('./services/emailService');

async function test() {
  try {
    await emailService.sendInviteEmail({
      email: process.env.TEST_EMAIL || "test@example.com",
      tempPassword: "test123",
      type: "admin",
      inviterName: "Test Script"
    });
    console.log("✅ Test email sent successfully");
  } catch (err) {
    console.error("❌ Email test failed:", err.message);
    if (process.env.NODE_ENV === 'development') {
      console.log(err.stack);
    }
  }
}

test();