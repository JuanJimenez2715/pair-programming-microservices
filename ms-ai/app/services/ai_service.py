import random

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
