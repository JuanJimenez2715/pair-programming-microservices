const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

const url = process.env.INFLUXDB_URL || 'http://influxdb:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token';
const org = process.env.INFLUXDB_ORG || 'pair-programming';
const bucket = process.env.INFLUXDB_BUCKET || 'metrics';

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

class InfluxQueryService {
  async getAiSuggestionsStats() {
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r._measurement == "ai_suggestions")
        |> filter(fn: (r) => r._field == "confidence")
        |> group(columns: ["type"])
        |> count()
    `;
    const results = [];
    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push({ type: o.type, count: o._value });
        },
        error(err) { reject(err); },
        complete() { resolve(results); },
      });
    });
  }
}

module.exports = new InfluxQueryService();