const fs = require('fs');
const path = require('path');

const dirs = [
  'infrastructure/scripts'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const initDbSql = `
-- Create databases for each microservice
CREATE DATABASE ms_auth_db;
CREATE DATABASE ms_pairing_db;
CREATE DATABASE ms_evaluation_db;
CREATE DATABASE ms_exercises_db;
CREATE DATABASE ms_reports_db;

\\c ms_auth_db;
-- Setup permissions or initial tables if needed

\\c ms_pairing_db;
-- Setup permissions or initial tables if needed
`;

const dockerComposeYml = `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pp_postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - pp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:7
    container_name: pp_mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - pp-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pp_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - pp-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  pp-network:
    driver: bridge

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
`;

const waitForItSh = `#!/usr/bin/env sh
# Use this script to test if a given TCP host/port are available

TIMEOUT=15
QUIET=0
HOST="$1"
PORT="$2"

echo "Waiting for $HOST:$PORT..."

for i in \`seq $TIMEOUT\` ; do
    nc -z "$HOST" "$PORT" > /dev/null 2>&1
    
    result=$?
    if [ $result -eq 0 ] ; then
        if [ $QUIET -ne 1 ] ; then echo "$HOST:$PORT is available after $i seconds" ; fi
        exit 0
    fi
    sleep 1
done

echo "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
exit 1
`;

fs.writeFileSync(path.join(__dirname, 'infrastructure/scripts/init-db.sql'), initDbSql);
fs.writeFileSync(path.join(__dirname, 'infrastructure/scripts/wait-for-it.sh'), waitForItSh);
fs.chmodSync(path.join(__dirname, 'infrastructure/scripts/wait-for-it.sh'), 0o755);
fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerComposeYml);

console.log("Phase 1 scaffolding complete");
