const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXP = process.env.JWT_ACCESS_EXPIRATION || '15m';

function generateAccessToken(user) {
  if (!ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET environment variable is missing.");
  }
  return jwt.sign(
    { sub: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXP }
  );
}

function verifyAccessToken(token) {
  if (!ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET environment variable is missing.");
  }
  return jwt.verify(token, ACCESS_SECRET);
}

function generateRawRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRawRefreshToken,
  hashRefreshToken
};
