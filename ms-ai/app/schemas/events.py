from pydantic import BaseModel
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
