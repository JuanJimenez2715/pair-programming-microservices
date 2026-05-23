const kafka = require('../config/kafka');
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

module.exports = new KafkaConsumerService();