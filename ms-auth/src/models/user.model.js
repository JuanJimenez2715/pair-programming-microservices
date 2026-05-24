const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  lastName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  role: { type: DataTypes.ENUM('student', 'teacher', 'admin'), defaultValue: 'student' }
});

module.exports = User;