const { Kafka } = require('kafkajs');
const env = require('./env');

const kafka = new Kafka({
  clientId: 'ms-editor',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

module.exports = kafka;