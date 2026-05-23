
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedUsers() {
  try {
    const count = await User.count();
    if (count === 0) {
      console.log('Seeding default users...');
      const pw = await bcrypt.hash('password123', 10);
      await User.bulkCreate([
        { id: '11111111-1111-1111-1111-111111111111', username: 'admin', email: 'admin@pair.com', passwordHash: pw, role: 'admin' },
        { id: '22222222-2222-2222-2222-222222222222', username: 'student1', email: 'student1@pair.com', passwordHash: pw, role: 'student' },
        { id: '33333333-3333-3333-3333-333333333333', username: 'student2', email: 'student2@pair.com', passwordHash: pw, role: 'student' },
      ]);
      console.log('Default users seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding users', err);
  }
}

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
