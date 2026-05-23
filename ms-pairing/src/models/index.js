const Session = require('./session.model');
const SessionUser = require('./sessionUser.model');

// Define associations
Session.hasMany(SessionUser, { foreignKey: 'sessionId' });
SessionUser.belongsTo(Session, { foreignKey: 'sessionId' });

module.exports = { Session, SessionUser };
