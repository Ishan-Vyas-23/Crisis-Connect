const { verifyAccessToken } = require('../utils/tokenUtils');
const { UnauthorizedError } = require('../utils/errors');
const prisma = require('../config/prisma');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError("Access token missing or invalid");
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        const expiredError = new UnauthorizedError("Access token has expired");
        expiredError.code = "TOKEN_EXPIRED";
        throw expiredError;
      }
      const invalidError = new UnauthorizedError("Invalid or corrupted access token");
      invalidError.code = "INVALID_TOKEN";
      throw invalidError;
    }

    // Treat database as the source of truth for role and status checks
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedError("User session no longer valid");
    }

    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
