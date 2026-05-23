#!/bin/bash
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

for topic in "${TOPICS[@]}"; do
  docker exec pp_kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic $topic
  echo "Topic $topic created or already exists."
done

echo "All topics configured successfully."
