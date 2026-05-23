const fs = require('fs');
const path = require('path');

const dirs = [
  'ms-auth/src/config',
  'ms-auth/src/controllers',
  'ms-auth/src/middlewares',
  'ms-auth/src/models',
  'ms-auth/src/routes',
  'ms-auth/src/services',
  'ms-auth/src/validators',
  'ms-auth/src/utils'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

files['ms-auth/package.json'] = JSON.stringify({
  name: "ms-auth",
  version: "1.0.0",
  main: "src/app.js",
  scripts: { "start": "node src/app.js" },
  dependencies: {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "winston": "^3.11.0"
  }
}, null, 2);

files['ms-auth/src/config/env.js'] = `require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DB_URL || 'postgres://admin:password@pp_postgres:5432/ms_auth_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtAccessExpiration: '15m',
  jwtRefreshExpiration: '7d'
};`;

files['ms-auth/src/config/db.js'] = `const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.dbUrl, {
  logging: false,
});

module.exports = sequelize;`;

files['ms-auth/src/utils/logger.js'] = `const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});
module.exports = logger;`;

files['ms-auth/src/models/user.model.js'] = `const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('student', 'teacher', 'admin'), defaultValue: 'student' }
});

module.exports = User;`;

files['ms-auth/src/models/refreshToken.model.js'] = `const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');

const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  token: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
});

RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });

module.exports = RefreshToken;`;

files['ms-auth/src/services/token.service.js'] = `const jwt = require('jsonwebtoken');
const env = require('../config/env');
const RefreshToken = require('../models/refreshToken.model');

const generateAuthTokens = async (user) => {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtAccessExpiration });
  const refreshToken = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtRefreshExpiration });
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({ token: refreshToken, userId: user.id, expiresAt });
  
  return { access: { token: accessToken }, refresh: { token: refreshToken } };
};

module.exports = { generateAuthTokens };`;

files['ms-auth/src/services/auth.service.js'] = `const bcrypt = require('bcrypt');
const User = require('../models/user.model');

const registerUser = async (email, password, role) => {
  if (await User.findOne({ where: { email } })) throw new Error('Email already taken');
  const hashedPassword = await bcrypt.hash(password, 10);
  return await User.create({ email, password: hashedPassword, role });
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new Error('Incorrect email or password');
  return user;
};

module.exports = { registerUser, loginUser };`;

files['ms-auth/src/controllers/auth.controller.js'] = `const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body.email, req.body.password, req.body.role);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(201).send({ user: { id: user.id, email: user.email, role: user.role }, tokens });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body.email, req.body.password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({ user: { id: user.id, email: user.email, role: user.role }, tokens });
  } catch (error) { next(error); }
};

const me = async (req, res) => {
  res.send({ user: req.user });
};

module.exports = { register, login, me };`;

files['ms-auth/src/middlewares/auth.middleware.js'] = `const jwt = require('jsonwebtoken');
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

files['ms-auth/src/middlewares/error.middleware.js'] = `const logger = require('../utils/logger');
module.exports = (err, req, res, next) => {
  logger.error(err.message);
  res.status(400).send({ error: err.message });
};`;

files['ms-auth/src/routes/auth.routes.js'] = `const express = require('express');
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth(), authController.me);

module.exports = router;`;

files['ms-auth/src/app.js'] = `const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => res.send('OK'));
app.use(errorMiddleware);

sequelize.sync().then(() => {
  app.listen(env.port, () => logger.info(\`ms-auth running on port \${env.port}\`));
}).catch(err => logger.error('DB connection failed', err));
`;

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

console.log('Phase 3 ms-auth scaffolding complete');
