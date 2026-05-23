const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token';
const org = process.env.INFLUXDB_ORG || 'pair-programming';
const bucket = process.env.INFLUXDB_BUCKET || 'metrics';
const url = process.env.INFLUXDB_URL || 'http://influxdb:8086';

const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket);

module.exports = { writeApi, InfluxDB };