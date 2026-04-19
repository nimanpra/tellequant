"""Tellequant worker entry point.

Exposes:
  • GET  /health              — liveness
  • WS   /twilio              — Twilio Media Streams websocket (inbound calls)
  • POST /campaigns/{id}/kick — kicks an outbound campaign dialing loop
"""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from loguru import logger
from twilio.rest import Client as TwilioClient

from .api_client import TellequantAPI
from .config import Settings, load
from .pipeline import TellequantSession


class WorkerState:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.api = TellequantAPI(settings)
        self.twilio = (
            TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
            if settings.twilio_account_sid and settings.twilio_auth_token
            else None
        )
        self.campaign_tasks: dict[str, asyncio.Task[None]] = {}


settings = load()
state = WorkerState(settings)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info(f"Tellequant worker starting on port {settings.port}")
    yield
    await state.api.close()
    for t in state.campaign_tasks.values():
        t.cancel()


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/twilio")
async def twilio_stream(ws: WebSocket) -> None:
    await ws.accept()
    call_id = ws.query_params.get("call_id")
    agent_id = ws.query_params.get("agent_id")

    # First two Twilio frames: connected, then start (with streamSid + custom parameters)
    stream_sid: str | None = None
    try:
        while stream_sid is None:
            msg = await ws.receive_text()
            data = json.loads(msg)
            if data.get("event") == "start":
                stream_sid = data["start"]["streamSid"]
                params = data["start"].get("customParameters", {})
                call_id = call_id or params.get("call_id")
                agent_id = agent_id or params.get("agent_id")
    except WebSocketDisconnect:
        logger.warning("Twilio disconnected before start frame")
        return

    if not (call_id and agent_id and stream_sid):
        logger.error("Missing call_id/agent_id/stream_sid")
        await ws.close(code=1008)
        return

    campaign_directive = ws.query_params.get("directive")
    session = TellequantSession(
        settings=settings,
        api=state.api,
        websocket=ws,
        stream_sid=stream_sid,
        call_id=call_id,
        agent_id=agent_id,
        campaign_directive=campaign_directive,
    )
    try:
        await session.run()
    except Exception as err:  # noqa: BLE001
        logger.exception(f"Session failed: {err}")


@app.post("/campaigns/{campaign_id}/kick")
async def kick_campaign(campaign_id: str) -> JSONResponse:
    """Start (or resume) the outbound dialing loop for a campaign."""
    if campaign_id in state.campaign_tasks and not state.campaign_tasks[campaign_id].done():
        return JSONResponse({"ok": True, "already_running": True})

    state.campaign_tasks[campaign_id] = asyncio.create_task(_dial_loop(campaign_id))
    return JSONResponse({"ok": True})


async def _dial_loop(campaign_id: str) -> None:
    """Ask the API for the next pending contact and place an outbound call via Twilio."""
    logger.info(f"Dial loop starting for campaign {campaign_id}")
    try:
        while True:
            result = await state.api.next_contact(campaign_id)
            contact = result.get("contact")
            if not contact:
                reason = result.get("reason")
                if reason in {"completed", "campaign_not_running"}:
                    logger.info(f"Dial loop done ({reason})")
                    return
                # at_concurrency_limit → wait and retry
                await asyncio.sleep(5)
                continue

            camp = result["campaign"]
            directive = camp.get("directive", "")
            agent_id = camp.get("agent_id")
            from_number = camp.get("from_number")
            if not from_number:
                logger.warning("Campaign has no from_number, aborting")
                return

            ws_base = settings.api_base_url.replace("https://", "wss://").replace(
                "http://", "ws://"
            )
            params = {"agent_id": agent_id, "directive": directive}
            query = "&".join(f"{k}={v}" for k, v in params.items())
            stream_url = f"{ws_base.replace('/api', '')}/twilio?{query}"

            twiml = (
                '<?xml version="1.0" encoding="UTF-8"?>'
                "<Response>"
                f"<Connect><Stream url=\"{stream_url}\">"
                f'<Parameter name="agent_id" value="{agent_id}"/>'
                f'<Parameter name="directive" value="{_xml_escape(directive)}"/>'
                "</Stream></Connect>"
                "</Response>"
            )

            if state.twilio is None:
                logger.error(
                    "Outbound dialing requires Twilio credentials on the worker "
                    "(Telnyx-native outbound is planned — see Phase 1.5 roadmap)"
                )
                return

            try:
                state.twilio.calls.create(
                    to=contact["phone"],
                    from_=from_number,
                    twiml=twiml,
                    status_callback=f"{settings.api_base_url}/api/twilio/status",
                    status_callback_event=["completed", "failed", "no-answer", "busy"],
                )
                logger.info(f"Placed call to {contact['phone']}")
            except Exception as err:  # noqa: BLE001
                logger.error(f"Twilio dial failed: {err}")

            await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        logger.info("Dial loop cancelled")
        raise


def _xml_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def main() -> None:
    uvicorn.run(
        "tellequant_worker.main:app",
        host="0.0.0.0",  # noqa: S104
        port=settings.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
