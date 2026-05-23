require('./tracing');
const express = require('express');
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
  app.listen(env.port, () => logger.info(`ms-auth running on port ${env.port}`));
}).catch(err => logger.error('DB connection failed', err));
