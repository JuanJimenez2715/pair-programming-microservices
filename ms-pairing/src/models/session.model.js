const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('Session', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  exerciseId: { type: DataTypes.UUID, allowNull: true },
  status: { type: DataTypes.ENUM('waiting', 'active', 'completed'), defaultValue: 'waiting' }
});

module.exports = Session;