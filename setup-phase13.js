const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirs = [
  'ms-analytics/src/config',
  'ms-analytics/src/services',
  'ms-analytics/src/utils',
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

files['ms-analytics/package.json'] = JSON.stringify({
  name: "ms-analytics",
  version: "1.0.0",
  main: "src/app.js",
  scripts: { "start": "node src/app.js" },
  dependencies: {
    "@influxdata/influxdb-client": "^1.33.2",
    "express": "^4.18.2",
    "kafkajs": "^2.2.4",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0"
  }
}, null, 2);

files['ms-analytics/src/utils/logger.js'] = `const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});
module.exports = logger;`;

files['ms-analytics/src/config/influx.js'] = `const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token';
const org = process.env.INFLUXDB_ORG || 'pair-programming';
const bucket = process.env.INFLUXDB_BUCKET || 'metrics';
const url = process.env.INFLUXDB_URL || 'http://influxdb:8086';

const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket);

module.exports = { writeApi, InfluxDB };`;

files['ms-analytics/src/config/kafka.js'] = `const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'ms-analytics',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

module.exports = kafka;`;

files['ms-analytics/src/services/metrics.service.js'] = `const { writeApi } = require('../config/influx');
const { Point } = require('@influxdata/influxdb-client');
const logger = require('../utils/logger');

class MetricsService {
  recordAiSuggestion(sessionId, type, confidence) {
    try {
      const point = new Point('ai_suggestions')
        .tag('session_id', sessionId)
        .tag('type', type)
        .floatField('confidence', confidence)
        .timestamp(new Date());
        
      writeApi.writePoint(point);
      writeApi.flush(); // Flush immediately for MVP
      logger.info(\`Recorded AI suggestion metric for session \${sessionId}\`);
    } catch (e) {
      logger.error('Error writing to InfluxDB', e);
    }
  }

  recordCollaborationEvent(sessionId, eventType, count = 1) {
    try {
      const point = new Point('collaboration_events')
        .tag('session_id', sessionId)
        .tag('event_type', eventType)
        .intField('count', count)
        .timestamp(new Date());
        
      writeApi.writePoint(point);
      writeApi.flush();
      logger.info(\`Recorded collaboration metric for session \${sessionId}\`);
    } catch (e) {
      logger.error('Error writing to InfluxDB', e);
    }
  }
}

module.exports = new MetricsService();`;

files['ms-analytics/src/services/kafkaConsumer.service.js'] = `const kafka = require('../config/kafka');
const logger = require('../utils/logger');
const metricsService = require('./metrics.service');

class KafkaConsumerService {
  constructor() {
    this.consumer = kafka.consumer({ groupId: 'ms-analytics-group' });
  }

  async connect() {
    try {
      await this.consumer.connect();
      logger.info('Analytics Kafka Consumer connected');
      
      await this.consumer.subscribe({ topic: 'ai-suggestions', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'collaboration-metrics', fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            
            if (topic === 'ai-suggestions') {
              metricsService.recordAiSuggestion(data.sessionId, data.type, data.confidence);
            } else if (topic === 'collaboration-metrics') {
              metricsService.recordCollaborationEvent(data.sessionId, data.eventType, data.count);
            }
          } catch (err) {
            logger.error('Error parsing metric message', err);
          }
        },
      });
    } catch (error) {
      logger.error('Failed to connect Analytics Consumer', error);
    }
  }
}

module.exports = new KafkaConsumerService();`;

files['ms-analytics/src/app.js'] = `const express = require('express');
const logger = require('./utils/logger');
const kafkaConsumer = require('./services/kafkaConsumer.service');

const app = express();
const port = process.env.PORT || 4000;

app.get('/health', (req, res) => res.send('Analytics OK'));

kafkaConsumer.connect();

app.listen(port, () => {
  logger.info(\`ms-analytics running on port \${port}\`);
});`;

files['ms-analytics/Dockerfile'] = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
`;

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

console.log('Installing dependencies in ms-analytics...');
execSync('npm install', { cwd: path.join(__dirname, 'ms-analytics'), stdio: 'inherit' });

// Add InfluxDB and ms-analytics to docker-compose.yml
let dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf8');

const influxService = `
  influxdb:
    image: influxdb:2.7
    container_name: pp_influxdb
    ports:
      - "8086:8086"
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: admin
      DOCKER_INFLUXDB_INIT_PASSWORD: password123
      DOCKER_INFLUXDB_INIT_ORG: pair-programming
      DOCKER_INFLUXDB_INIT_BUCKET: metrics
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: my-super-secret-auth-token
    networks:
      - pp-network

  ms-analytics:
    build: ./ms-analytics
    container_name: pp_ms_analytics
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - INFLUXDB_URL=http://influxdb:8086
      - INFLUXDB_TOKEN=my-super-secret-auth-token
      - INFLUXDB_ORG=pair-programming
      - INFLUXDB_BUCKET=metrics
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - kafka
      - influxdb
    networks:
      - pp-network
`;

if (!dockerCompose.includes('influxdb:')) {
  if (dockerCompose.includes('kong:')) {
    dockerCompose = dockerCompose.replace('kong:', influxService + '  kong:');
    fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
  }
}

console.log('Phase 13 ms-analytics setup complete');
