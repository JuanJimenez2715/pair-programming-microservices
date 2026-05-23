const jwt = require('jsonwebtoken');
const env = require('../config/env');
const RefreshToken = require('../models/refreshToken.model');

const generateAuthTokens = async (user) => {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtAccessExpiration });
  const refreshToken = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtRefreshExpiration });
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({ token: refreshToken, userId: user.id, expiresAt });
  
  return { access: { token: accessToken }, refresh: { token: refreshToken } };
};

module.exports = { generateAuthTokens };