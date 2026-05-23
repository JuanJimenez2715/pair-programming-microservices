import logging
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
