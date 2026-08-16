const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

let io = null;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    }
  });

  // Handshake Authorization Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth.token || socket.handshake.headers['authorization'];
      if (!authHeader) {
        return next(new Error("Authentication error: Token is missing"));
      }

      // Handle Bearer <token> format or raw token
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      const secret = process.env.JWT_ACCESS_SECRET || 'test_access_secret_key_1234567890_test_access_secret_key';
      
      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }

      const userId = decoded.sub;
      if (!userId) {
        return next(new Error("Authentication error: Invalid token payload"));
      }

      // Dynamic DB authorization check - verify user status and get current role
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return next(new Error("Authentication error: User account not found"));
      }

      // Attach current database user context to socket (do not rely on token role)
      socket.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (err) {
      next(new Error("Authentication error: Internal validation failure"));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    
    // 1. Every authenticated user automatically joins their own private user room
    socket.join(`user:${userId}`);

    // 2. Gated role-specific room joining
    if (role === 'ADMIN') {
      socket.join('role:ADMIN');
    } else if (role === 'ORGANIZATION_ADMIN') {
      socket.join('role:ORGANIZATION_ADMIN');
    }

    // 3. Authorized request to join specific incident rooms
    socket.on('incident:join', async ({ incidentId }, callback) => {
      try {
        if (!incidentId) {
          if (callback) callback({ success: false, message: "Missing incidentId" });
          return;
        }

        const incident = await prisma.incident.findUnique({
          where: { id: incidentId }
        });

        if (!incident) {
          if (callback) callback({ success: false, message: "Incident not found" });
          return;
        }

        let isAuthorized = false;

        if (socket.user.role === 'ADMIN' || socket.user.role === 'ORGANIZATION_ADMIN') {
          isAuthorized = true;
        } else if (socket.user.role === 'VOLUNTEER') {
          // Check if volunteer has an active assignment (PENDING, ACCEPTED, ACTIVE) to this incident
          const assignment = await prisma.incidentAssignment.findFirst({
            where: {
              incidentId,
              volunteer: { userId: socket.user.id },
              status: { in: ["PENDING", "ACCEPTED", "ACTIVE"] }
            }
          });
          if (assignment) {
            isAuthorized = true;
          }
        } else if (socket.user.role === 'CITIZEN') {
          // Check if this citizen originally reported the incident
          if (incident.reportedById === socket.user.id) {
            isAuthorized = true;
          }
        }

        if (isAuthorized) {
          socket.join(`incident:${incidentId}`);
          if (callback) {
            callback({ success: true, message: `Successfully joined room incident:${incidentId}` });
          }
        } else {
          if (callback) {
            callback({ success: false, message: "Forbidden: Unauthorized to subscribe to this incident's updates" });
          }
        }
      } catch (err) {
        if (callback) {
          callback({ success: false, message: "Internal server error during authorization check" });
        }
      }
    });

    // Request to leave incident rooms
    socket.on('incident:leave', ({ incidentId }, callback) => {
      if (incidentId) {
        socket.leave(`incident:${incidentId}`);
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, message: "Missing incidentId" });
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error for user ${userId}:`, err.message);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  getIO
};
