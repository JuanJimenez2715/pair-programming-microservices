const fs = require('fs');
const path = require('path');

const dirs = [
  'ms-pairing/src/config',
  'ms-pairing/src/controllers',
  'ms-pairing/src/middlewares',
  'ms-pairing/src/models',
  'ms-pairing/src/routes',
  'ms-pairing/src/services',
  'ms-pairing/src/utils'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

files['ms-pairing/package.json'] = JSON.stringify({
  name: "ms-pairing",
  version: "1.0.0",
  main: "src/app.js",
  scripts: { "start": "node src/app.js" },
  dependencies: {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "winston": "^3.11.0"
  }
}, null, 2);

files['ms-pairing/src/config/env.js'] = `require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DB_URL || 'postgres://admin:password@pp_postgres:5432/ms_pairing_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecret'
};`;

files['ms-pairing/src/config/db.js'] = `const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.dbUrl, {
  logging: false,
});

module.exports = sequelize;`;

files['ms-pairing/src/utils/logger.js'] = `const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});
module.exports = logger;`;

files['ms-pairing/src/models/session.model.js'] = `const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('Session', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  exerciseId: { type: DataTypes.UUID, allowNull: true },
  status: { type: DataTypes.ENUM('waiting', 'active', 'completed'), defaultValue: 'waiting' }
});

module.exports = Session;`;

files['ms-pairing/src/models/sessionUser.model.js'] = `const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Session = require('./session.model');

const SessionUser = sequelize.define('SessionUser', {
  userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  sessionId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, references: { model: Session, key: 'id' } },
  role: { type: DataTypes.ENUM('driver', 'navigator'), allowNull: false }
});

Session.hasMany(SessionUser, { foreignKey: 'sessionId' });
SessionUser.belongsTo(Session, { foreignKey: 'sessionId' });

module.exports = SessionUser;`;

files['ms-pairing/src/services/session.service.js'] = `const Session = require('../models/session.model');
const SessionUser = require('../models/sessionUser.model');

const createSession = async (userId, exerciseId = null) => {
  const session = await Session.create({ exerciseId });
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

module.exports = { createSession, getSessions, getSessionById, joinSession, swapRoles, completeSession };`;

files['ms-pairing/src/controllers/session.controller.js'] = `const sessionService = require('../services/session.service');

const createSession = async (req, res, next) => {
  try {
    const session = await sessionService.createSession(req.user.sub, req.body.exerciseId);
    res.status(201).send(session);
  } catch (error) { next(error); }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getSessions();
    res.send(sessions);
  } catch (error) { next(error); }
};

const getSessionById = async (req, res, next) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    res.send(session);
  } catch (error) { next(error); }
};

const joinSession = async (req, res, next) => {
  try {
    const session = await sessionService.joinSession(req.params.id, req.user.sub);
    res.send(session);
  } catch (error) { next(error); }
};

const swapRoles = async (req, res, next) => {
  try {
    const session = await sessionService.swapRoles(req.params.id);
    res.send(session);
  } catch (error) { next(error); }
};

const completeSession = async (req, res, next) => {
  try {
    const session = await sessionService.completeSession(req.params.id);
    res.send(session);
  } catch (error) { next(error); }
};

module.exports = { createSession, getSessions, getSessionById, joinSession, swapRoles, completeSession };`;

files['ms-pairing/src/middlewares/auth.middleware.js'] = `const jwt = require('jsonwebtoken');
const env = require('../config/env');

const auth = () => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ error: 'Please authenticate' });
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};
module.exports = auth;`;

files['ms-pairing/src/middlewares/error.middleware.js'] = `const logger = require('../utils/logger');
module.exports = (err, req, res, next) => {
  logger.error(err.message);
  res.status(400).send({ error: err.message });
};`;

files['ms-pairing/src/routes/session.routes.js'] = `const express = require('express');
const sessionController = require('../controllers/session.controller');
const auth = require('../middlewares/auth.middleware');
const router = express.Router();

router.use(auth()); // All routes require authentication

router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSessionById);
router.post('/:id/join', sessionController.joinSession);
router.put('/:id/swap-roles', sessionController.swapRoles);
router.put('/:id/complete', sessionController.completeSession);

module.exports = router;`;

files['ms-pairing/src/app.js'] = `const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const sequelize = require('./config/db');
const sessionRoutes = require('./routes/session.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRoutes);
app.get('/health', (req, res) => res.send('OK'));
app.use(errorMiddleware);

sequelize.sync().then(() => {
  app.listen(env.port, () => logger.info(\`ms-pairing running on port \${env.port}\`));
}).catch(err => logger.error('DB connection failed', err));
`;

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

console.log('Phase 4 ms-pairing scaffolding complete');
