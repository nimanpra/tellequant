"""HTTP client for calling the Tellequant Next.js API from the worker."""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

import httpx
from loguru import logger

from .config import Settings


class TellequantAPI:
    """Thin wrapper that signs every request with an HMAC header."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(timeout=30.0)

    async def close(self) -> None:
        await self._client.aclose()

    def _sign(self, body: str) -> str:
        return hmac.new(
            self._settings.shared_secret.encode(),
            body.encode(),
            hashlib.sha256,
        ).hexdigest()

    async def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        raw = json.dumps(body)
        headers = {
            "content-type": "application/json",
            "x-tellequant-worker-key": self._sign(raw),
        }
        url = f"{self._settings.api_base_url}{path}"
        resp = await self._client.post(url, content=raw, headers=headers)
        resp.raise_for_status()
        return resp.json()

    async def get_agent_config(self, agent_id: str) -> dict[str, Any]:
        return await self._post(f"/api/agents/{agent_id}/config", {})

    async def rag_search(self, kb_id: str, query: str, top_k: int = 6) -> list[dict[str, Any]]:
        data = await self._post(
            "/api/rag/search", {"kb_id": kb_id, "query": query, "top_k": top_k}
        )
        return data.get("matches", [])

    async def post_events(self, call_id: str, events: list[dict[str, Any]]) -> None:
        if not events:
            return
        try:
            await self._post("/api/calls/events", {"call_id": call_id, "events": events})
        except httpx.HTTPError as err:
            logger.warning(f"post_events failed: {err}")

    async def complete_call(self, payload: dict[str, Any]) -> None:
        try:
            await self._post("/api/calls/complete", payload)
        except httpx.HTTPError as err:
            logger.error(f"complete_call failed: {err}")

    async def next_contact(self, campaign_id: str) -> dict[str, Any]:
        return await self._post(f"/api/campaigns/{campaign_id}/next", {})
