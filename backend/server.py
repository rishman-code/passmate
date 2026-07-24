import os
import uuid

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExplanationRequest(BaseModel):
    question_text: str = Field(max_length=1000)
    category: str = Field(max_length=100)
    wrong_answer_text: str = Field(max_length=500)
    correct_answer_text: str = Field(max_length=500)
    official_explanation: str = Field(max_length=1000)


SYSTEM_MESSAGE = "You are a friendly UK driving instructor helping a learner prepare for their DVSA theory test."


@app.post("/api/ai-explanation")
async def generate_ai_explanation(payload: ExplanationRequest):
    prompt = f"""Question: {payload.question_text}
Category: {payload.category}
Student's wrong answer: {payload.wrong_answer_text}
Correct answer: {payload.correct_answer_text}
Official DVSA explanation: {payload.official_explanation}

Explain in 2-3 short paragraphs why the student's answer was wrong and why the correct answer is right. Use simple language. Be encouraging, not condescending."""

    try:
        if ANTHROPIC_API_KEY:
            client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            message = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=500,
                system=SYSTEM_MESSAGE,
                messages=[{"role": "user", "content": prompt}],
            )
            response = message.content[0].text
        else:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=str(uuid.uuid4()),
                system_message=SYSTEM_MESSAGE,
            ).with_model("anthropic", "claude-sonnet-4-6")
            response = await chat.send_message(UserMessage(text=prompt))
    except Exception:
        raise HTTPException(status_code=502, detail="AI provider error")

    return {"explanation": response}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
