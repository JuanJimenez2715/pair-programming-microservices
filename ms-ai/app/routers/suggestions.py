from fastapi import APIRouter
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
