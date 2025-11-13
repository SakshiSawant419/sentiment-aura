"""
Sentiment Aura Backend Server
FastAPI server that proxies requests to OpenAI API for sentiment analysis.
Handles CORS, error handling, and async operations gracefully.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from typing import Optional, List
import os
import json
import logging
from dotenv import load_dotenv

# -------------------------------------------------------
# Logging Setup
# -------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("sentiment-aura")

# -------------------------------------------------------
# Environment Setup
# -------------------------------------------------------
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set in environment variables")

# Optional:Deepgram too
if not DEEPGRAM_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY is not set in environment variables")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)
# -------------------------------------------------------
# FastAPI App
# -------------------------------------------------------
app = FastAPI(
    title="Sentiment Aura API",
    description="Real-time sentiment + emotional attribute extraction",
    version="1.0.0",
)

# -------------------------------------------------------
# CORS Configuration for Production
# -------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://sentiment-aura.vercel.app",
        "https://sentiment-aura-sigma.vercel.app",     
        "https://sentiment-aura-*.vercel.app",          
        "https://*.vercel.app", 
    ]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# Request / Response Models
# -------------------------------------------------------
class TextInput(BaseModel):
    text: str = Field(..., min_length=1)

class SentimentResponse(BaseModel):
    sentiment: str
    score: float
    keywords: List[str]
    attributes: dict

# -------------------------------------------------------
# Root & Health Endpoints
# -------------------------------------------------------
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Sentiment Aura API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "openai_configured": True,
        "timestamp": "2025-11-12T00:00:00Z"
    }

# -------------------------------------------------------
# Main Analysis Endpoint
# -------------------------------------------------------
@app.post("/process_text", response_model=SentimentResponse)
async def process_text(input_data: TextInput):
    try:
        logger.info(f"Processing text ({len(input_data.text)} chars)")

        system_prompt = """
        You are a sentiment analysis expert. Return ONLY valid JSON in this format:

        {
            "sentiment": "positive" | "neutral" | "negative",
            "score": <float -1 to 1>,
            "keywords": ["word1", "word2", ...],
            "attributes": {
                "intensity": <0-1>,
                "energy": <0-1>,
                "valence": <0-1>,
                "complexity": <0-1>
            }
        }
        """

        user_prompt = f"Analyze this text:\n\n{input_data.text}"

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=200,
            temperature=0.3,
        )

        result_text = response.choices[0].message.content.strip()

        logger.info(f"OpenAI raw response: {result_text[:120]}...")

        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            logger.error("JSON parse error")
            raise HTTPException(status_code=500, detail="OpenAI returned invalid JSON")

        sentiment = SentimentResponse(
            sentiment=result.get("sentiment", "neutral"),
            score=float(result.get("score", 0.0)),
            keywords=result.get("keywords", []),
            attributes=result.get("attributes", {})
        )

        logger.info(f"Final sentiment: {sentiment.sentiment} ({sentiment.score})")
        return sentiment

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# -------------------------------------------------------
# Error Handlers
# -------------------------------------------------------
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found", "path": str(request.url)}
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# -------------------------------------------------------
# Uvicorn Entrypoint
# -------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.environ.get("PORT", 8000))  # Railway provides PORT
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    )
