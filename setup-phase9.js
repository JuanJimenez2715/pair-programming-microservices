const fs = require('fs');
const path = require('path');

const dirs = [
  'infrastructure/kafka'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

let dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf8');

const kafkaServices = `
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: pp_zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - pp-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: pp_kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    networks:
      - pp-network
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "localhost:9092", "--list"]
      interval: 10s
      timeout: 5s
      retries: 5

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: pp_kafka_ui
    ports:
      - "9090:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    depends_on:
      - kafka
    networks:
      - pp-network
`;

if (!dockerCompose.includes('kafka:')) {
  if (dockerCompose.includes('networks:')) {
    dockerCompose = dockerCompose.replace('networks:', kafkaServices + '\\nnetworks:');
  } else {
    dockerCompose += kafkaServices;
  }
  fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
}

const createTopicsScript = `#!/bin/bash
# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."

# Define topics
TOPICS=(
  "session-events"
  "code-events"
  "ai-suggestions"
  "evaluation-completed"
  "collaboration-metrics"
)

for topic in "\${TOPICS[@]}"; do
  docker exec pp_kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic $topic
  echo "Topic $topic created or already exists."
done

echo "All topics configured successfully."
`;

fs.writeFileSync(path.join(__dirname, 'infrastructure/kafka/create-topics.sh'), createTopicsScript);
fs.chmodSync(path.join(__dirname, 'infrastructure/kafka/create-topics.sh'), 0o755);

console.log('Phase 9 Kafka setup complete');
