const fs = require('fs');
const path = require('path');

const dirs = [
  'ms-ai/app/routers',
  'ms-ai/app/services',
  'ms-ai/app/consumers',
  'ms-ai/app/producers',
  'ms-ai/app/schemas'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {};

files['ms-ai/requirements.txt'] = `fastapi==0.104.1
uvicorn==0.24.0
confluent-kafka==2.3.0
pydantic==2.5.2
python-dotenv==1.0.0
`;

files['ms-ai/app/config.py'] = `import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    CODE_EVENTS_TOPIC = "code-events"
    AI_SUGGESTIONS_TOPIC = "ai-suggestions"

settings = Settings()
`;

files['ms-ai/app/schemas/events.py'] = `from pydantic import BaseModel
from typing import Dict, Any, Optional

class CodeEvent(BaseModel):
    sessionId: str
    userId: str
    delta: Dict[str, Any]
    language: str
    cursor: Optional[Dict[str, int]] = None
    timestamp: str

class AiSuggestion(BaseModel):
    sessionId: str
    suggestion: str
    confidence: float
    type: str
    timestamp: str
`;

files['ms-ai/app/services/ai_service.py'] = `import random

class AIService:
    @staticmethod
    def generate_mock_suggestion(language: str, delta: dict) -> dict:
        suggestions = [
            "Consider extracting this logic into a separate function.",
            "Make sure to handle potential NullPointer exceptions here.",
            "You could use a list comprehension here to make it more Pythonic.",
            "Don't forget to write a unit test for this new condition.",
            "Variable naming could be more descriptive."
        ]
        
        return {
            "suggestion": random.choice(suggestions),
            "confidence": round(random.uniform(0.6, 0.99), 2),
            "type": "refactor"
        }
`;

files['ms-ai/app/producers/suggestion_producer.py'] = `import json
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
`;

files['ms-ai/app/consumers/code_consumer.py'] = `import json
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
`;

files['ms-ai/app/routers/suggestions.py'] = `from fastapi import APIRouter
from app.schemas.events import CodeEvent
from app.services.ai_service import AIService

router = APIRouter()

@router.post("/suggest")
async def suggest_code(event: CodeEvent):
    """On-demand suggestion endpoint for testing without Kafka"""
    result = AIService.generate_mock_suggestion(event.language, event.delta)
    return {
        "sessionId": event.sessionId,
        "suggestion": result["suggestion"],
        "confidence": result["confidence"],
        "type": result["type"]
    }

@router.get("/models")
async def list_models():
    return {"models": ["mock-gpt-4", "mock-codex"]}
`;

files['ms-ai/app/main.py'] = `import logging
from fastapi import FastAPI
from app.routers import suggestions
from app.consumers.code_consumer import consumer_instance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ms-ai", description="AI Mock Service for Pair Programming")

app.include_router(suggestions.router, prefix="/api/ai", tags=["AI"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up ms-ai...")
    try:
        consumer_instance.start()
    except Exception as e:
        logger.error(f"Could not start Kafka consumer: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down ms-ai...")
    consumer_instance.stop()

@app.get("/health")
def health():
    return {"status": "ok", "service": "ms-ai"}
`;

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

// Update Dockerfile to ensure uvicorn runs app.main:app
let dockerfilePath = path.join(__dirname, 'ms-ai/Dockerfile');
let dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
if (!dockerfileContent.includes('uvicorn')) {
  dockerfileContent = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
`;
  fs.writeFileSync(dockerfilePath, dockerfileContent);
}

// Ensure ms-ai is registered in docker-compose.yml with proper ports
let dockerCompose = fs.readFileSync(path.join(__dirname, 'docker-compose.yml'), 'utf8');
if (!dockerCompose.includes('ms-ai:')) {
  const msAiService = `
  ms-ai:
    build: ./ms-ai
    container_name: pp_ms_ai
    ports:
      - "8080:8080"
    environment:
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    depends_on:
      - kafka
    networks:
      - pp-network
`;
  if (dockerCompose.includes('kong:')) {
    dockerCompose = dockerCompose.replace('kong:', msAiService + '  kong:');
    fs.writeFileSync(path.join(__dirname, 'docker-compose.yml'), dockerCompose);
  }
}

console.log('Phase 10 ms-ai mock setup complete');
