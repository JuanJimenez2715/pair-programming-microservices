const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  language: {
    type: String,
    required: true,
    default: 'javascript',
  },
  initialCode: {
    type: String,
    default: '',
  },
  expectedOutput: {
    type: String,
    default: '',
  },
  testCases: [{
    input: String,
    expectedOutput: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
