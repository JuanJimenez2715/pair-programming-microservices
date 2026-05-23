
const { Session, SessionUser } = require('./models');

async function seedSessions() {
  try {
    const count = await Session.count();
    if (count === 0) {
      console.log('Seeding default session...');
      await Session.create({
        id: 'test-session-001',
        title: 'Sesión de Prueba Global',
        status: 'active',
        settings: { language: 'javascript' }
      });
      // Añadir student1 como driver y student2 como navigator
      await SessionUser.bulkCreate([
        { SessionId: 'test-session-001', userId: '22222222-2222-2222-2222-222222222222', role: 'driver' },
        { SessionId: 'test-session-001', userId: '33333333-3333-3333-3333-333333333333', role: 'navigator' }
      ]);
      console.log('Default session seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding sessions', err);
  }
}

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
