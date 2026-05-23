const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Session = require('./session.model');

const SessionUser = sequelize.define('SessionUser', {
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  sessionId: { type: DataTypes.STRING, allowNull: false, primaryKey: true, references: { model: Session, key: 'id' } },
  role: { type: DataTypes.ENUM('driver', 'navigator'), allowNull: false }
});

module.exports = SessionUser;