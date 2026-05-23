const logger = require('../utils/logger');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.sub} (Socket ID: ${socket.id})`);

    socket.on('join-session', ({ sessionId }) => {
      socket.join(sessionId);
      logger.info(`User ${socket.user.sub} joined session room ${sessionId}`);
      
      // Notify others in the room
      socket.to(sessionId).emit('user-joined', { userId: socket.user.sub, role: socket.user.role });
    });

    socket.on('code-change', ({ sessionId, delta, version }) => {
      // Broadcast code change to everyone else in the room
      socket.to(sessionId).emit('code-change', { delta, userId: socket.user.sub, version });
    });

    socket.on('cursor-move', ({ sessionId, position }) => {
      socket.to(sessionId).emit('cursor-move', { position, userId: socket.user.sub });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.sub} (Socket ID: ${socket.id})`);
      // Could broadcast user-left to rooms they were in, but socket.io handles room leaving on disconnect
    });
  });
};

module.exports = socketHandler;