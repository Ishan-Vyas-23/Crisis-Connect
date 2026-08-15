const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const {
  EmailConflictError,
  InvalidCredentialsError,
  UnauthorizedError
} = require('../utils/errors');
const {
  generateAccessToken,
  generateRawRefreshToken,
  hashRefreshToken
} = require('../utils/tokenUtils');

async function registerUser({ name, email, password, phone }) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new EmailConflictError();
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      role: 'CITIZEN' // Enforce CITIZEN role by default
    }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRawRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt
    }
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }
  };
}

async function refreshSession(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw new UnauthorizedError("Refresh token missing");
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);

  // First check if the token exists at all (revoked or active)
  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash }
  });

  if (!existingToken) {
    throw new UnauthorizedError("Invalid or expired session token");
  }

  // REUSE DETECTION: If token exists but was already revoked, revoke all active sessions for this user!
  if (existingToken.revokedAt !== null) {
    await prisma.refreshToken.updateMany({
      where: {
        userId: existingToken.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
    throw new UnauthorizedError("Invalid or expired session token");
  }

  // Token is found and not revoked. Check if expired.
  if (existingToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired session token");
  }

  const rawNewRefreshToken = generateRawRefreshToken();
  const newHash = hashRefreshToken(rawNewRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Perform rotation within a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch token and lock/check in transaction (re-verification)
    const token = await tx.refreshToken.findUnique({
      where: { id: existingToken.id }
    });

    if (!token || token.revokedAt !== null || token.expiresAt < new Date()) {
      throw new Error("TRANSACTION_TOKEN_INVALID");
    }

    // 2. Revoke the old token
    await tx.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() }
    });

    // 3. Create the new refresh token record
    const newTokenRecord = await tx.refreshToken.create({
      data: {
        tokenHash: newHash,
        userId: token.userId,
        expiresAt
      }
    });

    // 4. Fetch safe user profile details
    const user = await tx.user.findUnique({
      where: { id: token.userId }
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      newTokenRecord
    };
  }).catch(err => {
    if (err.message === "TRANSACTION_TOKEN_INVALID" || err.message === "USER_NOT_FOUND") {
      throw new UnauthorizedError("Invalid or expired session token");
    }
    throw err;
  });

  const newAccessToken = generateAccessToken(result.user);

  return {
    accessToken: newAccessToken,
    refreshToken: rawNewRefreshToken,
    user: result.user
  };
}

async function revokeSession(rawRefreshToken) {
  if (!rawRefreshToken) {
    return; // Already cleared/no session
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash }
  });

  if (existingToken && existingToken.revokedAt === null) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() }
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshSession,
  revokeSession
};
