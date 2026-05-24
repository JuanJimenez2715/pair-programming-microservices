const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('Session', {
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => require('crypto').randomUUID() },
  title: { type: DataTypes.STRING, allowNull: true },
  exerciseId: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('waiting', 'active', 'completed'), defaultValue: 'waiting' },
  settings: { type: DataTypes.JSONB, allowNull: true }
});

module.exports = Session;