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
      logger.info('Seeding demo sessions...');

      // Sessions for students
      await Session.bulkCreate([
        { id: 'session-js-001', title: 'Fundamentos de JavaScript — Arrays y Objetos', status: 'active', settings: { language: 'javascript', difficulty: 'beginner', course: 'Programación I' } },
        { id: 'session-py-002', title: 'Algoritmo de Ordenamiento — Merge Sort', status: 'active', settings: { language: 'python', difficulty: 'intermediate', course: 'Estructuras de Datos' } },
        { id: 'session-react-003', title: 'Componente de Navegación — React Hooks', status: 'active', settings: { language: 'javascript', difficulty: 'advanced', course: 'Desarrollo Web' } },
        { id: 'session-java-004', title: 'Patrones de Diseño — Singleton y Factory', status: 'waiting', settings: { language: 'java', difficulty: 'advanced', course: 'Ingeniería de Software' } },
        { id: 'session-sql-005', title: 'Consultas SQL Avanzadas — JOINs y Subqueries', status: 'completed', settings: { language: 'sql', difficulty: 'intermediate', course: 'Bases de Datos' } },
      ]);

      // Student UUIDs from ms-auth seeder
      const CARLOS = '22222222-2222-2222-2222-222222222222';
      const MARIA = '33333333-3333-3333-3333-333333333333';
      const DIEGO = '44444444-4444-4444-4444-444444444444';

      await SessionUser.bulkCreate([
        // Session 1: Carlos (driver) + Maria (navigator)
        { sessionId: 'session-js-001', userId: CARLOS, role: 'driver' },
        { sessionId: 'session-js-001', userId: MARIA, role: 'navigator' },
        // Session 2: Maria (driver) + Diego (navigator)
        { sessionId: 'session-py-002', userId: MARIA, role: 'driver' },
        { sessionId: 'session-py-002', userId: DIEGO, role: 'navigator' },
        // Session 3: Carlos (driver) only — waiting for pair
        { sessionId: 'session-react-003', userId: CARLOS, role: 'driver' },
        // Session 4: waiting — no participants yet
        // Session 5: completed session
        { sessionId: 'session-sql-005', userId: DIEGO, role: 'driver' },
        { sessionId: 'session-sql-005', userId: CARLOS, role: 'navigator' },
      ]);

      logger.info('✅ Demo sessions seeded: 5 sessions with participant assignments.');
    }
  } catch (err) {
    logger.error('Error seeding sessions', err);
  }
}

sequelize.sync({ alter: true }).then(async () => {
  await seedSessions();
  app.listen(env.port, () => logger.info(`ms-pairing running on port ${env.port}`));
}).catch(err => logger.error('DB connection failed', err));
