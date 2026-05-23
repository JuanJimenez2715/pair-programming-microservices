import json
import logging
from confluent_kafka import Producer
from app.config import settings
from app.schemas.events import AiSuggestion

logger = logging.getLogger(__name__)

class SuggestionProducer:
    def __init__(self):
        conf = {'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS}
        try:
            self.producer = Producer(conf)
            logger.info("Kafka Producer initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka Producer: {e}")
            self.producer = None

    def delivery_report(self, err, msg):
        if err is not None:
            logger.error(f'Message delivery failed: {err}')
        else:
            logger.info(f'Message delivered to {msg.topic()} [{msg.partition()}]')

    def send_suggestion(self, suggestion: AiSuggestion):
        if not self.producer:
            logger.warning("Producer not available. Suggestion not sent.")
            return

        try:
            data = suggestion.model_dump_json()
            self.producer.produce(
                topic=settings.AI_SUGGESTIONS_TOPIC,
                key=suggestion.sessionId.encode('utf-8'),
                value=data.encode('utf-8'),
                callback=self.delivery_report
            )
            self.producer.poll(0)
        except Exception as e:
            logger.error(f"Error sending suggestion: {e}")

producer_instance = SuggestionProducer()
