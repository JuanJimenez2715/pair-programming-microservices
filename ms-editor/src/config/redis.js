const Redis = require('ioredis');
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

module.exports = { pubClient, subClient, cacheClient };