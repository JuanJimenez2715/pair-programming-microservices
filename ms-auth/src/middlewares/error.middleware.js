const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.originalUrl} — ${err.message}`);

  // Determine proper status code
  let statusCode = err.statusCode || 500;

  // Map known error messages to proper HTTP codes
  if (err.message === 'Email already taken' || err.message === 'El correo ya está registrado.') {
    statusCode = 409;
  } else if (err.message === 'Incorrect email or password' || err.message === 'Correo o contraseña incorrectos.') {
    statusCode = 401;
  } else if (err.message.includes('validación') || err.message.includes('Validation')) {
    statusCode = 422;
  }

  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};