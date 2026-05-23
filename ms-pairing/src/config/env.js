require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DB_URL || 'postgres://admin:password@pp_postgres:5432/ms_pairing_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecret'
};