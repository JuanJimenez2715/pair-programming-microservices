import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    CODE_EVENTS_TOPIC = "code-events"
    AI_SUGGESTIONS_TOPIC = "ai-suggestions"

settings = Settings()
