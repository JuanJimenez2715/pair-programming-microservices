const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user.model');

/**
 * Authentication middleware factory.
 * @param {...string} roles - Optional list of allowed roles. If empty, any authenticated user is allowed.
 */
const auth = (...roles) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    // Attach full user info (fetch from DB to ensure fresh data)
    const user = await User.findByPk(payload.sub, {
      attributes: ['id', 'email', 'role', 'firstName', 'lastName']
    });

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });

    req.user = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Role-based access control
    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso.' });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor inicia sesión de nuevo.' });
    }
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = auth;