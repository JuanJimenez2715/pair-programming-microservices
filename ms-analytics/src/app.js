const express = require('express');
const logger = require('./utils/logger');
const kafkaConsumer = require('./services/kafkaConsumer.service');

const app = express();
const port = process.env.PORT || 4000;

app.get('/health', (req, res) => res.send('Analytics OK'));

kafkaConsumer.connect();

app.listen(port, () => {
  logger.info(`ms-analytics running on port ${port}`);
});