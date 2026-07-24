import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExplanationRequest(BaseModel):
    question_text: str
    category: str
    wrong_answer_text: str
    correct_answer_text: str
    official_explanation: str


@app.post("/api/ai-explanation")
async def generate_ai_explanation(payload: ExplanationRequest):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id="passmate-explanation",
        system_message="You are a friendly UK driving instructor helping a learner prepare for their DVSA theory test.",
    ).with_model("anthropic", "claude-sonnet-4-6")

    prompt = f"""Question: {payload.question_text}
Category: {payload.category}
Student's wrong answer: {payload.wrong_answer_text}
Correct answer: {payload.correct_answer_text}
Official DVSA explanation: {payload.official_explanation}

Explain in 2-3 short paragraphs why the student's answer was wrong and why the correct answer is right. Use simple language. Be encouraging, not condescending."""

    response = await chat.send_message(UserMessage(text=prompt))
    return {"explanation": response}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
