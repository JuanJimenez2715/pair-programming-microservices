const { pubClient, subClient } = require('../config/redis');
const logger = require('../utils/logger');

class RedisPubSubService {
  constructor() {
    this.callbacks = new Map();
    
    subClient.on('message', (channel, message) => {
      const callback = this.callbacks.get(channel);
      if (callback) {
        try {
          callback(message);
        } catch (e) {
          logger.error(`Error processing message on channel ${channel}`, e);
        }
      }
    });
  }

  subscribe(channel, callback) {
    if (!this.callbacks.has(channel)) {
      subClient.subscribe(channel, (err) => {
        if (err) logger.error(`Failed to subscribe to ${channel}`, err);
        else logger.info(`Subscribed to Redis channel: ${channel}`);
      });
    }
    this.callbacks.set(channel, callback);
  }

  unsubscribe(channel) {
    this.callbacks.delete(channel);
    subClient.unsubscribe(channel);
    logger.info(`Unsubscribed from Redis channel: ${channel}`);
  }

  publish(channel, message) {
    pubClient.publish(channel, typeof message === 'string' ? message : JSON.stringify(message));
  }
}

module.exports = new RedisPubSubService();