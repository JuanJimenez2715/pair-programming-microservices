require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DB_URL || 'postgres://admin:password@pp_postgres:5432/ms_auth_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '2h',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
};