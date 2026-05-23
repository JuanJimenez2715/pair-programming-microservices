const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing kafkajs...');
execSync('npm install kafkajs', { cwd: path.join(__dirname, 'ms-editor'), stdio: 'inherit' });

const files = {};

files['ms-editor/src/config/kafka.js'] = `const { Kafka } = require('kafkajs');
const env = require('./env');

const kafka = new Kafka({
  clientId: 'ms-editor',
  brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

module.exports = kafka;`;

files['ms-editor/src/services/kafkaProducer.service.js'] = `const kafka = require('../config/kafka');
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
      logger.info(\`Code event sent to Kafka for session \${sessionId}\`);
    } catch (error) {
      logger.error('Error sending code event to Kafka', error);
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}

module.exports = new KafkaProducerService();`;

files['ms-editor/src/services/kafkaConsumer.service.js'] = `const kafka = require('../config/kafka');
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
            logger.info(\`Received AI suggestion for session \${data.sessionId}\`);
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

module.exports = new KafkaConsumerService();`;

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

const appJsPath = path.join(__dirname, 'ms-editor/src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

if (!appJsContent.includes('kafkaProducer')) {
  const requires = `const kafkaProducer = require('./services/kafkaProducer.service');\nconst kafkaConsumer = require('./services/kafkaConsumer.service');\n`;
  appJsContent = requires + appJsContent;
  
  const serverListenPos = appJsContent.indexOf('server.listen(env.port');
  
  const initKafkaCode = `// Initialize Kafka
kafkaProducer.connect();
kafkaConsumer.connect((suggestion) => {
  // Broadcast AI suggestion via Redis so all instances can push it to their WebSockets
  redisPubSub.publish(\`session:\${suggestion.sessionId}:ai-suggestions\`, suggestion);
});

`;

  appJsContent = appJsContent.slice(0, serverListenPos) + initKafkaCode + appJsContent.slice(serverListenPos);
  
  const restEndpoint = `
app.post('/api/editor/:sessionId/sync', async (req, res) => {
  const { sessionId } = req.params;
  const { code, language, userId } = req.body;
  
  // Publish to Kafka
  await kafkaProducer.sendCodeEvent(sessionId, { fullCode: code }, language || 'javascript', userId || 'unknown');
  res.send({ status: 'sync_requested' });
});

`;
  
  const getHealthPos = appJsContent.indexOf("app.get('/health'");
  appJsContent = appJsContent.slice(0, getHealthPos) + restEndpoint + appJsContent.slice(getHealthPos);

  fs.writeFileSync(appJsPath, appJsContent);
}

console.log('Phase 11 CQRS Backend setup complete');
