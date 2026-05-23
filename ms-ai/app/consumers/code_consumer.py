import json
import logging
import threading
from datetime import datetime
from confluent_kafka import Consumer, KafkaError
from app.config import settings
from app.schemas.events import CodeEvent, AiSuggestion
from app.services.ai_service import AIService
from app.producers.suggestion_producer import producer_instance

logger = logging.getLogger(__name__)

class CodeEventConsumer:
    def __init__(self):
        conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': 'ms-ai-consumer-group',
            'auto.offset.reset': 'latest'
        }
        try:
            self.consumer = Consumer(conf)
        except Exception as e:
            logger.error(f"Could not initialize consumer: {e}")
            self.consumer = None
        self.running = False

    def start(self):
        if not self.consumer:
            return
        self.consumer.subscribe([settings.CODE_EVENTS_TOPIC])
        self.running = True
        thread = threading.Thread(target=self._consume_loop)
        thread.daemon = True
        thread.start()
        logger.info(f"Started listening to {settings.CODE_EVENTS_TOPIC}")

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()

    def _consume_loop(self):
        while self.running:
            msg = self.consumer.poll(1.0)
            
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                logger.error(f"Consumer error: {msg.error()}")
                continue
                
            try:
                data = json.loads(msg.value().decode('utf-8'))
                event = CodeEvent(**data)
                logger.info(f"Received code event for session {event.sessionId}")
                
                # Generate Mock AI Suggestion
                mock_result = AIService.generate_mock_suggestion(event.language, event.delta)
                
                suggestion = AiSuggestion(
                    sessionId=event.sessionId,
                    suggestion=mock_result["suggestion"],
                    confidence=mock_result["confidence"],
                    type=mock_result["type"],
                    timestamp=datetime.utcnow().isoformat()
                )
                
                # Send to Kafka
                producer_instance.send_suggestion(suggestion)
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")

consumer_instance = CodeEventConsumer()
