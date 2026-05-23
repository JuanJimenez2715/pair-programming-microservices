const { cacheClient } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 3600; // 1 hour

class SessionCacheService {
  async cacheSessionState(sessionId, state) {
    try {
      await cacheClient.setex(`session:${sessionId}:state`, CACHE_TTL, JSON.stringify(state));
    } catch (err) {
      logger.error('Failed to cache session state', err);
    }
  }

  async getSessionState(sessionId) {
    try {
      const state = await cacheClient.get(`session:${sessionId}:state`);
      return state ? JSON.parse(state) : null;
    } catch (err) {
      logger.error('Failed to get session state', err);
      return null;
    }
  }

  async clearSessionState(sessionId) {
    try {
      await cacheClient.del(`session:${sessionId}:state`);
    } catch (err) {
      logger.error('Failed to clear session state', err);
    }
  }
}

module.exports = new SessionCacheService();