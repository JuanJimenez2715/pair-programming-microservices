import json
import urllib.request
import urllib.error

import os

class AIService:
    @staticmethod
    def generate_mock_suggestion(language: str, delta: dict) -> dict:
        # Instead of a mock suggestion, we will call the Groq API using LLaMA 3.
        # Note: delta in ms-editor contains the fullCode
        code = delta.get('fullCode', '') if isinstance(delta, dict) else str(delta)
        
        if not code or len(code.strip()) < 5:
            return {
                "suggestion": "Escribe un poco más de código para que pueda darte sugerencias.",
                "confidence": 0.99,
                "type": "info"
            }
            
        api_key = os.getenv("GROQ_API_KEY", "")
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system", 
                    "content": "Eres un tutor experto de Pair Programming. Analiza el código y da UNA ÚNICA sugerencia breve y concisa (máximo 2 oraciones) en español. Puede ser para mejorar rendimiento, sintaxis, o buenas prácticas. No des ejemplos de código largos, solo el consejo."
                },
                {
                    "role": "user", 
                    "content": f"Lenguaje: {language}\nCódigo:\n{code}"
                }
            ],
            "temperature": 0.5,
            "max_tokens": 150
        }
        
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=10) as response:
                response_data = json.loads(response.read().decode('utf-8'))
                suggestion_text = response_data['choices'][0]['message']['content'].strip()
                
                return {
                    "suggestion": suggestion_text,
                    "confidence": 0.95,
                    "type": "ai_review"
                }
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            return {
                "suggestion": "La IA está descansando en este momento. Intenta de nuevo.",
                "confidence": 0.0,
                "type": "error"
            }
