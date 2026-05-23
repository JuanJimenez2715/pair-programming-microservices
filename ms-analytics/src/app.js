const express = require('express');
const logger = require('./utils/logger');
const kafkaConsumer = require('./services/kafkaConsumer.service');
const influxQueryService = require('./services/influxQuery.service');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 4000;

app.get('/health', (req, res) => res.send('Analytics OK'));

app.get('/api/analytics/ai-stats', async (req, res) => {
  try {
    const stats = await influxQueryService.getAiSuggestionsStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


kafkaConsumer.connect();

app.listen(port, () => {
  logger.info(`ms-analytics running on port ${port}`);
});