const { writeApi } = require('../config/influx');
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
      logger.info(`Recorded AI suggestion metric for session ${sessionId}`);
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
      logger.info(`Recorded collaboration metric for session ${sessionId}`);
    } catch (e) {
      logger.error('Error writing to InfluxDB', e);
    }
  }
}

module.exports = new MetricsService();