const kafka = require('../config/kafka');
const logger = require('../utils/logger');

class KafkaProducerService {
  constructor() {
    this.producer = kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka Producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka Producer', error);
    }
  }

  async sendCodeEvent(sessionId, delta, language, userId) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: 'code-events',
        messages: [{
          key: sessionId,
          value: JSON.stringify({
            sessionId,
            userId,
            delta,
            language,
            timestamp: new Date().toISOString()
          })
        }]
      });
      logger.info(`Code event sent to Kafka for session ${sessionId}`);
    } catch (error) {
      logger.error('Error sending code event to Kafka', error);
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}

module.exports = new KafkaProducerService();