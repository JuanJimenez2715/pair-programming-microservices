require('./tracing');
const express = require('express');
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
  app.listen(env.port, () => logger.info(`ms-pairing running on port ${env.port}`));
}).catch(err => logger.error('DB connection failed', err));
