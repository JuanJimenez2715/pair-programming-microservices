const jwt = require('jsonwebtoken');
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
module.exports = auth;