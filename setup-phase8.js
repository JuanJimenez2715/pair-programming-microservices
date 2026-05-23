const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing ioredis in ms-editor...');
execSync('npm install ioredis', { cwd: path.join(__dirname, 'ms-editor'), stdio: 'inherit' });

const dirs = ['ms-editor/src/services'];
dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

files['ms-editor/src/config/redis.js'] = `const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

const redisOptions = {
  host: process.env.REDIS_HOST || 'pp_redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

const pubClient = new Redis(redisOptions);
const subClient = new Redis(redisOptions);
const cacheClient = new Redis(redisOptions);

pubClient.on('error', (err) => logger.error('Redis PubClient Error', err));
subClient.on('error', (err) => logger.error('Redis SubClient Error', err));
cacheClient.on('error', (err) => logger.error('Redis CacheClient Error', err));

pubClient.on('connect', () => logger.info('Redis PubClient Connected'));

module.exports = { pubClient, subClient, cacheClient };`;

files['ms-editor/src/services/redis.service.js'] = `const { pubClient, subClient } = require('../config/redis');
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
          logger.error(\`Error processing message on channel \${channel}\`, e);
        }
      }
    });
  }

  subscribe(channel, callback) {
    if (!this.callbacks.has(channel)) {
      subClient.subscribe(channel, (err) => {
        if (err) logger.error(\`Failed to subscribe to \${channel}\`, err);
        else logger.info(\`Subscribed to Redis channel: \${channel}\`);
      });
    }
    this.callbacks.set(channel, callback);
  }

  unsubscribe(channel) {
    this.callbacks.delete(channel);
    subClient.unsubscribe(channel);
    logger.info(\`Unsubscribed from Redis channel: \${channel}\`);
  }

  publish(channel, message) {
    pubClient.publish(channel, typeof message === 'string' ? message : JSON.stringify(message));
  }
}

module.exports = new RedisPubSubService();`;

files['ms-editor/src/services/sessionCache.service.js'] = `const { cacheClient } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 3600; // 1 hour

class SessionCacheService {
  async cacheSessionState(sessionId, state) {
    try {
      await cacheClient.setex(\`session:\${sessionId}:state\`, CACHE_TTL, JSON.stringify(state));
    } catch (err) {
      logger.error('Failed to cache session state', err);
    }
  }

  async getSessionState(sessionId) {
    try {
      const state = await cacheClient.get(\`session:\${sessionId}:state\`);
      return state ? JSON.parse(state) : null;
    } catch (err) {
      logger.error('Failed to get session state', err);
      return null;
    }
  }

  async clearSessionState(sessionId) {
    try {
      await cacheClient.del(\`session:\${sessionId}:state\`);
    } catch (err) {
      logger.error('Failed to clear session state', err);
    }
  }
}

module.exports = new SessionCacheService();`;

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

// We are going to hook Redis into the app.js or let it be ready for scaling Yjs
const appJsPath = path.join(__dirname, 'ms-editor/src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

if (!appJsContent.includes('redis.service')) {
  const requireRedis = `const redisPubSub = require('./services/redis.service');\nconst sessionCache = require('./services/sessionCache.service');\n`;
  appJsContent = requireRedis + appJsContent;
  fs.writeFileSync(appJsPath, appJsContent);
}

console.log('Phase 8 ms-editor Redis Pub/Sub setup complete');
