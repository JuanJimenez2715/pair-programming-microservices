require('./tracing');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const sequelize = require('./config/db');
const { Session, SessionUser } = require('./models');
const sessionRoutes = require('./routes/session.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRoutes);
app.get('/health', (req, res) => res.send('OK'));
app.use(errorMiddleware);

async function seedSessions() {
  try {
    const count = await Session.count();
    if (count === 0) {
      logger.info('Seeding default session...');
      await Session.create({
        id: 'test-session-001',
        title: 'Sesión de Prueba Global - JS',
        status: 'active',
        settings: { language: 'javascript' }
      });
      await Session.create({
        id: 'demo-python-002',
        title: 'Algoritmo de Ordenamiento - Python',
        status: 'active',
        settings: { language: 'python' }
      });
      await Session.create({
        id: 'demo-react-003',
        title: 'Componente de Navegación - React',
        status: 'active',
        settings: { language: 'javascript' }
      });
      
      await SessionUser.bulkCreate([
        { sessionId: 'test-session-001', userId: '22222222-2222-2222-2222-222222222222', role: 'driver' },
        { sessionId: 'test-session-001', userId: '33333333-3333-3333-3333-333333333333', role: 'navigator' },
        { sessionId: 'demo-python-002', userId: '22222222-2222-2222-2222-222222222222', role: 'navigator' },
        { sessionId: 'demo-python-002', userId: '33333333-3333-3333-3333-333333333333', role: 'driver' },
        { sessionId: 'demo-react-003', userId: '22222222-2222-2222-2222-222222222222', role: 'driver' }
      ]);
      logger.info('Default session seeded successfully.');
    }
  } catch (err) {
    logger.error('Error seeding sessions', err);
  }
}

sequelize.sync({ alter: true }).then(async () => {
  await seedSessions();
  app.listen(env.port, () => logger.info(`ms-pairing running on port ${env.port}`));
}).catch(err => logger.error('DB connection failed', err));
