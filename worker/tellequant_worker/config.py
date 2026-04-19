"""Environment configuration for the worker."""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        raise RuntimeError(f"Missing required env var: {name}")
    return v


@dataclass(frozen=True)
class Settings:
    api_base_url: str
    shared_secret: str
    deepgram_api_key: str
    gemini_api_key: str | None
    groq_api_key: str | None
    cartesia_api_key: str | None
    openai_api_key: str | None
    twilio_account_sid: str | None
    twilio_auth_token: str | None
    telnyx_api_key: str | None
    telnyx_connection_id: str | None
    port: int


def load() -> Settings:
    return Settings(
        api_base_url=_require("TELLEQUANT_API_BASE_URL").rstrip("/"),
        shared_secret=_require("VOICE_WORKER_SHARED_SECRET"),
        deepgram_api_key=_require("DEEPGRAM_API_KEY"),
        gemini_api_key=os.environ.get("GEMINI_API_KEY"),
        groq_api_key=os.environ.get("GROQ_API_KEY"),
        cartesia_api_key=os.environ.get("CARTESIA_API_KEY"),
        openai_api_key=os.environ.get("OPENAI_API_KEY"),
        twilio_account_sid=os.environ.get("TWILIO_ACCOUNT_SID"),
        twilio_auth_token=os.environ.get("TWILIO_AUTH_TOKEN"),
        telnyx_api_key=os.environ.get("TELNYX_API_KEY"),
        telnyx_connection_id=os.environ.get("TELNYX_CONNECTION_ID"),
        port=int(os.environ.get("PORT", "8787")),
    )
