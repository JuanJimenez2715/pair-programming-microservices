const Session = require('../models/session.model');
const SessionUser = require('../models/sessionUser.model');

const createSession = async (userId, exerciseId = null, body = {}) => {
  const session = await Session.create({
    exerciseId,
    title: body.title || 'Nueva Sesión de Pair Programming',
    status: 'waiting',
    settings: {
      language: body.language || 'javascript',
      difficulty: body.difficulty || 'beginner',
      course: body.course || 'General'
    }
  });
  await SessionUser.create({ sessionId: session.id, userId, role: 'driver' });
  return session;
};

const getSessions = async () => {
  return await Session.findAll({ include: [SessionUser] });
};

const getSessionById = async (id) => {
  const session = await Session.findByPk(id, { include: [SessionUser] });
  if (!session) throw new Error('Session not found');
  return session;
};

const joinSession = async (sessionId, userId) => {
  const session = await getSessionById(sessionId);
  if (session.status === 'completed') throw new Error('Session is completed');

  const usersCount = session.SessionUsers.length;
  if (usersCount >= 2) throw new Error('Session is full');

  const existingUser = session.SessionUsers.find(su => su.userId === userId);
  if (existingUser) return session;

  await SessionUser.create({ sessionId, userId, role: 'navigator' });
  await session.update({ status: 'active' });

  return await getSessionById(sessionId);
};

const swapRoles = async (sessionId) => {
  const users = await SessionUser.findAll({ where: { sessionId } });
  if (users.length !== 2) throw new Error('Need exactly 2 users to swap roles');

  for (let user of users) {
    user.role = user.role === 'driver' ? 'navigator' : 'driver';
    await user.save();
  }
  return await getSessionById(sessionId);
};

const completeSession = async (sessionId) => {
  const session = await getSessionById(sessionId);
  await session.update({ status: 'completed' });
  return session;
};

module.exports = { createSession, getSessions, getSessionById, joinSession, swapRoles, completeSession };