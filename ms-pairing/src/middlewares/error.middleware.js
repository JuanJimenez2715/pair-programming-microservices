const logger = require('../utils/logger');
module.exports = (err, req, res, next) => {
  logger.error(err.message);
  res.status(400).send({ error: err.message });
};