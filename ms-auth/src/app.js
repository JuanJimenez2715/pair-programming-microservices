require('./tracing');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const env = require('./config/env');
const sequelize = require('./config/db');
const User = require('./models/user.model');
const RefreshToken = require('./models/refreshToken.model');
const authRoutes = require('./routes/auth.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => res.send('OK'));
app.use(errorMiddleware);

async function seedUsers() {
  try {
    const count = await User.count();
    if (count === 0) {
      logger.info('Seeding demo users...');
      const pw = await bcrypt.hash('password123', 12);

      await User.bulkCreate([
        // Admin
        { id: '11111111-1111-1111-1111-111111111111', email: 'admin@intellipair.com', password: pw, role: 'admin', firstName: 'Admin', lastName: 'Sistema' },
        // Estudiantes
        { id: '22222222-2222-2222-2222-222222222222', email: 'carlos.mendez@est.edu', password: pw, role: 'student', firstName: 'Carlos', lastName: 'Méndez' },
        { id: '33333333-3333-3333-3333-333333333333', email: 'maria.lopez@est.edu', password: pw, role: 'student', firstName: 'María', lastName: 'López' },
        { id: '44444444-4444-4444-4444-444444444444', email: 'diego.ramirez@est.edu', password: pw, role: 'student', firstName: 'Diego', lastName: 'Ramírez' },
        // Profesores
        { id: '55555555-5555-5555-5555-555555555555', email: 'prof.garcia@docente.edu', password: pw, role: 'teacher', firstName: 'Ana', lastName: 'García' },
        { id: '66666666-6666-6666-6666-666666666666', email: 'prof.torres@docente.edu', password: pw, role: 'teacher', firstName: 'Roberto', lastName: 'Torres' },
        { id: '77777777-7777-7777-7777-777777777777', email: 'prof.silva@docente.edu', password: pw, role: 'teacher', firstName: 'Laura', lastName: 'Silva' },
      ]);

      logger.info('✅ Demo users seeded: 3 students, 3 teachers, 1 admin. Password: password123');
    }
  } catch (err) {
    logger.error('Error seeding users', err);
  }
}

sequelize.sync({ alter: true }).then(async () => {
  await seedUsers();
  app.listen(env.port, () => logger.info(`ms-auth running on port ${env.port}`));
}).catch(err => logger.error('DB connection failed', err));
