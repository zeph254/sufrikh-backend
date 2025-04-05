const crypto = require('crypto');

const generateTempPassword = (length = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(byte => chars[byte % chars.length])
    .join('');
};

module.exports = { generateTempPassword };