import asyncio
import json
import os
import re
import sys
import uuid

import anthropic
import httpx
from dotenv import load_dotenv

from emergentintegrations.llm.chat import LlmChat, UserMessage

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(BACKEND_DIR)

load_dotenv(os.path.join(BACKEND_DIR, '.env'))
load_dotenv(os.path.join(REPO_ROOT, '.env'))

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
SUPABASE_URL = os.environ.get('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

DVSA_CATEGORIES = [
    'Alertness', 'Attitude', 'Safety and Your Vehicle', 'Safety Margins',
    'Hazard Awareness', 'Vulnerable Road Users', 'Other Types of Vehicle',
    'Vehicle Handling', 'Motorway Rules', 'Rules of the Road',
    'Road and Traffic Signs', 'Documents', 'Accidents', 'Vehicle Loading',
]

SYSTEM_MESSAGE = (
    "You are a UK driving theory test content writer with deep knowledge of the official "
    "DVSA Highway Code and theory test syllabus. You write factually accurate, exam-realistic "
    "multiple-choice questions."
)


async def fetch_existing_questions(category: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/questions",
            params={"select": "question_text", "category": f"eq.{category}"},
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"},
        )
        resp.raise_for_status()
        return [row["question_text"] for row in resp.json()]


def extract_json_array(text: str):
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON array found in response")
    return json.loads(match.group(0))


async def call_claude(prompt: str) -> str:
    if ANTHROPIC_API_KEY:
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8000,
            system=SYSTEM_MESSAGE,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_MESSAGE,
    ).with_model("anthropic", "claude-sonnet-4-6")
    return await chat.send_message(UserMessage(text=prompt))


async def generate_questions(category: str, count: int, existing: list[str]):
    existing_list = "\n".join(f"- {q}" for q in existing) or "(none yet)"

    prompt = f"""Generate exactly {count} NEW UK DVSA driving theory test multiple-choice questions for the category "{category}".

Rules:
- Must be factually accurate per the current UK Highway Code / DVSA syllabus.
- Do NOT duplicate or closely rephrase any of these existing questions in this category:
{existing_list}
- Each question has exactly 4 options (a, b, c, d), only ONE correct.
- explanation must be 1-2 sentences, factual, matching the official DVSA reasoning style.
- Vary question difficulty and phrasing style realistically like a real exam bank.

Return ONLY a raw JSON array (no markdown, no commentary), each item shaped exactly as:
{{"question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_answer": "a", "explanation": "..."}}
"""

    response = await call_claude(prompt)
    questions = extract_json_array(response)
    for q in questions:
        q["id"] = str(uuid.uuid4())
        q["category"] = category
    return questions


async def insert_questions(questions: list[dict]):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/questions",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            json=questions,
        )
        resp.raise_for_status()
        return resp.json()


async def main():
    category = sys.argv[1]
    count = int(sys.argv[2])
    existing = await fetch_existing_questions(category)
    print(f"Existing questions in '{category}': {len(existing)}")
    questions = await generate_questions(category, count, existing)
    print(f"Generated {len(questions)} questions")
    inserted = await insert_questions(questions)
    print(f"Inserted {len(inserted)} questions into Supabase")
    for q in questions[:5]:
        print(json.dumps(q, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
