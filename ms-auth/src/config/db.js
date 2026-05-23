const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.dbUrl, {
  logging: false,
});

module.exports = sequelize;