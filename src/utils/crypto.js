const crypto = require('crypto');

const ALGO = 'aes-256-cbc';
const IV_LENGTH = 16;

function encrypt(text, password) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(password).digest();

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    data: encrypted,
  };
}

function decrypt(encryptedData, password) {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const key = crypto.createHash('sha256').update(password).digest();

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};
