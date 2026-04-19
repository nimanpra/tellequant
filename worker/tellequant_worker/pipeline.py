"""Realtime voice pipeline — Twilio Media Streams → Deepgram STT → LLM (with RAG tools) → TTS."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any

from loguru import logger
from pipecat.frames.frames import (
    EndFrame,
    LLMMessagesFrame,
    TranscriptionFrame,
    TTSTextFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.services.deepgram import DeepgramSTTService, DeepgramTTSService
from pipecat.services.google import GoogleLLMService
from pipecat.services.openai import OpenAILLMService
from pipecat.transports.network.fastapi_websocket import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)
from pipecat.vad.silero import SileroVADAnalyzer

from .api_client import TellequantAPI
from .config import Settings


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_system_prompt(agent: dict[str, Any], campaign_directive: str | None = None) -> str:
    parts = [agent.get("persona") or "You are a helpful voice assistant.", ""]
    if campaign_directive:
        parts.extend(
            [
                "OUTBOUND CAMPAIGN DIRECTIVE — this is what you must accomplish on this call:",
                campaign_directive,
                "",
            ]
        )
    parts.extend(
        [
            "You are on a live phone call. Speak naturally — one or two short sentences per turn.",
            "Never read raw data or JSON out loud. Never announce tool calls.",
            "If the caller goes silent for more than a few seconds, ask a gentle question.",
            "When the conversation is complete, call end_call with a brief outcome summary.",
        ]
    )
    return "\n".join(parts)


def _build_tools(agent: dict[str, Any]) -> list[dict[str, Any]]:
    tools: list[dict[str, Any]] = []
    enabled = {t.get("name") if isinstance(t, dict) else t for t in (agent.get("tools") or [])}

    if agent.get("knowledge_base_id"):
        tools.append(
            {
                "type": "function",
                "function": {
                    "name": "search_knowledge_base",
                    "description": "Look up facts in the company's knowledge base. Use this whenever the caller asks something that requires specific company information.",
                    "parameters": {
                        "type": "object",
                        "properties": {"query": {"type": "string"}},
                        "required": ["query"],
                    },
                },
            }
        )
    if "end_call" in enabled or not enabled:
        tools.append(
            {
                "type": "function",
                "function": {
                    "name": "end_call",
                    "description": "End the call. Call when the conversation is complete or the caller wants to hang up.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "outcome": {
                                "type": "string",
                                "description": "Short label, e.g. 'appointment booked', 'declined', 'voicemail'.",
                            },
                            "summary": {"type": "string"},
                        },
                        "required": ["outcome"],
                    },
                },
            }
        )
    return tools


class EventRecorder(FrameProcessor):
    """Capture transcription + TTS frames and forward them to the API as call_events."""

    def __init__(self, call_id: str, api: TellequantAPI) -> None:
        super().__init__()
        self._call_id = call_id
        self._api = api
        self._queue: list[dict[str, Any]] = []
        self._flush_task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        self._flush_task = asyncio.create_task(self._flush_loop())

    async def stop(self) -> None:
        if self._flush_task:
            self._flush_task.cancel()
        await self._api.post_events(self._call_id, self._queue)
        self._queue.clear()

    async def _flush_loop(self) -> None:
        while True:
            await asyncio.sleep(2.0)
            if self._queue:
                batch, self._queue = self._queue, []
                await self._api.post_events(self._call_id, batch)

    def record_tool_call(self, name: str, args: dict[str, Any]) -> None:
        self._queue.append(
            {"kind": "tool_call", "at": _now_iso(), "payload": {"name": name, "args": args}}
        )

    async def process_frame(self, frame, direction: FrameDirection) -> None:  # type: ignore[override]
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame) and frame.text:
            self._queue.append(
                {"kind": "user_speech", "at": _now_iso(), "payload": {"text": frame.text}}
            )
        elif isinstance(frame, TTSTextFrame) and getattr(frame, "text", None):
            self._queue.append(
                {"kind": "agent_speech", "at": _now_iso(), "payload": {"text": frame.text}}
            )
        await self.push_frame(frame, direction)


class TellequantSession:
    """A single call — holds the pipeline, tool handlers, and lifecycle."""

    def __init__(
        self,
        settings: Settings,
        api: TellequantAPI,
        websocket,
        stream_sid: str,
        call_id: str,
        agent_id: str,
        campaign_directive: str | None = None,
    ) -> None:
        self._settings = settings
        self._api = api
        self._ws = websocket
        self._stream_sid = stream_sid
        self._call_id = call_id
        self._agent_id = agent_id
        self._campaign_directive = campaign_directive
        self._started_at = datetime.now(timezone.utc)
        self._ended = False
        self._outcome: str | None = None
        self._summary: str | None = None
        self._recorder: EventRecorder | None = None

    async def run(self) -> None:
        agent = await self._api.get_agent_config(self._agent_id)
        logger.info(f"Starting call {self._call_id} with agent {agent['name']}")

        serializer = TwilioFrameSerializer(self._stream_sid)
        transport = FastAPIWebsocketTransport(
            websocket=self._ws,
            params=FastAPIWebsocketParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                add_wav_header=False,
                vad_analyzer=SileroVADAnalyzer(),
                serializer=serializer,
            ),
        )

        stt = DeepgramSTTService(
            api_key=self._settings.deepgram_api_key,
            model="nova-3",
            language="en",
        )
        llm = self._build_llm(agent)
        tts = DeepgramTTSService(
            api_key=self._settings.deepgram_api_key,
            voice=agent["voice_id"],
        )

        recorder = EventRecorder(self._call_id, self._api)
        self._recorder = recorder

        system_prompt = _build_system_prompt(agent, self._campaign_directive)
        context = OpenAILLMContext(
            messages=[{"role": "system", "content": system_prompt}],
            tools=_build_tools(agent),
        )
        context_agg = llm.create_context_aggregator(context)

        self._register_tool_handlers(llm, agent)

        pipeline = Pipeline(
            [
                transport.input(),
                stt,
                recorder,
                context_agg.user(),
                llm,
                tts,
                transport.output(),
                context_agg.assistant(),
            ]
        )

        task = PipelineTask(pipeline)

        @transport.event_handler("on_client_connected")
        async def on_connected(_t, _client):
            await recorder.start()
            opener = agent.get("opening_line") or "Hello?"
            await task.queue_frame(
                LLMMessagesFrame(
                    [
                        {"role": "system", "content": system_prompt},
                        {"role": "assistant", "content": opener},
                    ]
                )
            )

        @transport.event_handler("on_client_disconnected")
        async def on_disconnected(_t, _client):
            await task.queue_frame(EndFrame())

        runner = PipelineRunner()
        try:
            await runner.run(task)
        finally:
            await self._finalize()

    def _build_llm(self, agent: dict[str, Any]):
        provider = (agent.get("llm_provider") or "groq").lower()
        model = agent["llm_model"]
        temperature = agent.get("temperature", 0.4)

        if provider == "groq":
            if not self._settings.groq_api_key:
                raise RuntimeError("GROQ_API_KEY is not set")
            return OpenAILLMService(
                api_key=self._settings.groq_api_key,
                model=model,
                base_url="https://api.groq.com/openai/v1",
            )
        if provider == "openai":
            if not self._settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is not set")
            return OpenAILLMService(api_key=self._settings.openai_api_key, model=model)
        if provider == "gemini":
            if not self._settings.gemini_api_key:
                raise RuntimeError("GEMINI_API_KEY is not set")
            return GoogleLLMService(
                api_key=self._settings.gemini_api_key,
                model=model,
                params=GoogleLLMService.InputParams(temperature=temperature),
            )
        raise RuntimeError(f"Unsupported llm_provider: {provider}")

    def _register_tool_handlers(self, llm, agent: dict[str, Any]) -> None:
        kb_id = agent.get("knowledge_base_id")

        async def search_knowledge_base(
            _llm, _ctx, _tool_id, args: dict[str, Any], *_a, **_kw
        ) -> Any:
            query = args.get("query", "")
            if self._recorder:
                self._recorder.record_tool_call("search_knowledge_base", {"query": query})
            if not kb_id:
                return {"matches": []}
            matches = await self._api.rag_search(kb_id, query, top_k=4)
            return {"matches": [{"content": m["content"]} for m in matches]}

        async def end_call(
            _llm, _ctx, _tool_id, args: dict[str, Any], *_a, **_kw
        ) -> Any:
            self._outcome = args.get("outcome")
            self._summary = args.get("summary")
            if self._recorder:
                self._recorder.record_tool_call("end_call", args)
            self._ended = True
            return {"ok": True}

        llm.register_function("search_knowledge_base", search_knowledge_base)
        llm.register_function("end_call", end_call)

    async def _finalize(self) -> None:
        if self._recorder:
            await self._recorder.stop()
        ended_at = datetime.now(timezone.utc)
        duration = int((ended_at - self._started_at).total_seconds())
        await self._api.complete_call(
            {
                "call_id": self._call_id,
                "status": "completed" if self._ended or duration > 5 else "failed",
                "ended_at": ended_at.isoformat(),
                "duration_seconds": duration,
                "cost_cents": _estimate_cost_cents(duration),
                "summary": self._summary,
                "outcome": self._outcome,
                "sentiment": None,
                "metadata": {"agent_id": self._agent_id},
            }
        )


def _estimate_cost_cents(seconds: int) -> int:
    """Rough blended cost: Twilio + Deepgram STT + Gemini + Deepgram TTS ≈ $0.05/min."""
    return int(round(seconds / 60.0 * 5))
