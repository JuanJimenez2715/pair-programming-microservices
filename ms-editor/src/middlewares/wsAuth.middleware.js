const jwt = require('jsonwebtoken');
const env = require('../config/env');

const wsAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: No token provided'));
  
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    socket.user = payload; // Attach user payload to socket
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = wsAuthMiddleware;