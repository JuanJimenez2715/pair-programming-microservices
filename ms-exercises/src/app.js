const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const exerciseRoutes = require('./routes/exerciseRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ms-exercises' }));

app.use('/api/exercises', exerciseRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@mongodb:27017/exercises?authSource=admin';

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`ms-exercises running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });