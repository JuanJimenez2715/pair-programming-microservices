const { InfluxDB, Point } = require('@influxdata/influxdb-client');
require('dotenv').config();

const url = process.env.INFLUXDB_URL || 'http://influxdb:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token';
const org = process.env.INFLUXDB_ORG || 'pair-programming';
const bucket = process.env.INFLUXDB_BUCKET || 'metrics';

const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket, 'ns');

class MetricsService {
  recordAiSuggestion(sessionId, type, confidence) {
    const point = new Point('ai_suggestions')
      .tag('sessionId', sessionId)
      .tag('type', type || 'general')
      .floatField('confidence', confidence || 0.5);
    writeApi.writePoint(point);
    writeApi.flush();
    console.log(`[metrics] AI suggestion recorded: ${sessionId} ${type}`);
  }

  recordCollaborationEvent(sessionId, eventType, count) {
    const point = new Point('collaboration_events')
      .tag('sessionId', sessionId)
      .tag('eventType', eventType || 'edit')
      .intField('count', count || 1);
    writeApi.writePoint(point);
    writeApi.flush();
    console.log(`[metrics] Collaboration event recorded: ${sessionId} ${eventType}`);
  }
}

module.exports = new MetricsService();