const kafka = require('../config/kafka');
const logger = require('../utils/logger');

class KafkaConsumerService {
  constructor() {
    this.consumer = kafka.consumer({ groupId: 'ms-editor-group' });
  }

  async connect(onMessageCallback) {
    try {
      await this.consumer.connect();
      logger.info('Kafka Consumer connected successfully');
      
      await this.consumer.subscribe({ topic: 'ai-suggestions', fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            logger.info(`Received AI suggestion for session ${data.sessionId}`);
            if (onMessageCallback) {
              onMessageCallback(data);
            }
          } catch (err) {
            logger.error('Error parsing AI suggestion message', err);
          }
        },
      });
    } catch (error) {
      logger.error('Failed to connect Kafka Consumer', error);
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}

module.exports = new KafkaConsumerService();