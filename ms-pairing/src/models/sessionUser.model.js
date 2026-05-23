const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Session = require('./session.model');

const SessionUser = sequelize.define('SessionUser', {
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  sessionId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, references: { model: Session, key: 'id' } },
  role: { type: DataTypes.ENUM('driver', 'navigator'), allowNull: false }
});

Session.hasMany(SessionUser, { foreignKey: 'sessionId' });
SessionUser.belongsTo(Session, { foreignKey: 'sessionId' });

module.exports = SessionUser;