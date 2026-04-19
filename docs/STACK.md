# Tellequant Stack — Cost-Minimized (April 2026)

## Recommended production stack
**Twilio Voice + Media Streams → Pipecat (self-hosted, Fly.io) → Deepgram Nova-3 STT → Gemini 2.5 Flash LLM → Deepgram Aura-2 TTS → Supabase pgvector + OpenAI text-embedding-3-small.**

All-in ≈ **$0.075–0.085 / minute** (inbound) — under the $0.08/min target with RAG headroom.

## Per-minute cost breakdown (3-minute inbound US call)

| Layer | Provider / Model | Rate | $/min |
|---|---|---|---|
| Telephony inbound | Twilio local DID | $0.0085/min | 0.0085 |
| Media Streams | Twilio | $0.004/min | 0.0040 |
| STT (streaming) | Deepgram Nova-3 | $0.0077/min | 0.0077 |
| LLM (≈4 turns/min, 1k in + 250 out) | Gemini 2.5 Flash | $0.15/M in, $0.60/M out | 0.0012 |
| TTS (~900 chars/min) | Deepgram Aura-2 | $0.030/1k chars | 0.0270 |
| Vector / RAG (10 queries) | Supabase pgvector + embed-3-small | ~free at volume | 0.0001 |
| Orchestrator compute | Pipecat self-host on Fly.io | ~$0.002/min | 0.0020 |
| **All-in** | | | **≈ $0.0505/min inbound** |

Outbound adds ~$0.005/min (Twilio outbound is higher than inbound DID).

## Free-tier runway

| Provider | Free allowance | ≈3-min calls |
|---|---|---|
| Twilio trial | $15 credit (verified caller IDs only) | ~750 inbound-only test calls |
| Deepgram | $200 credit, no CC, no expiry | ~8,600 Nova-3 streaming calls |
| Gemini 2.5 Flash | 1,500 req/day free (**data used for training — not for prod**) | ~375 dev calls/day |
| OpenAI | $5 new-account credit, 90-day expiry | ~1,600 min transcribe |
| Cartesia | Monthly free credits | A few hundred dev calls |
| Supabase | 500 MB DB, 5 GB egress, auto-pause after 1-week idle | Unlimited dev |
| Pinecone Starter | 2 GB storage, 2M WU / 1M RU per month | Unlimited dev |
| Qdrant Cloud | 1 GB RAM / 4 GB disk free tier | Unlimited dev |
| Groq | 30 RPM / 1,000 RPD on Llama 3.3 70B | Dev only — RPD kills prod |
| LiveKit Cloud Build | 1k agent min + 5k WebRTC min / mo | ~330 dev calls |

## Three zero-spend dev/local stacks

1. **Fully local (no telephony)**  
   Ollama (Llama 3.1 8B) + faster-whisper + Piper TTS → Pipecat local transport → browser mic. Swap in Twilio when E2E testing.

2. **Free-credit burn**  
   Twilio trial + Deepgram $200 + Gemini Flash free + Supabase free + Qdrant free. Several thousand real calls at $0.

3. **LiveKit-native prototype**  
   LiveKit Cloud Build + Groq free + ElevenLabs free + Qdrant free. Full browser↔agent loop, add Twilio SIP for PSTN later.

## Gotchas (April 2026)
- **Twilio Media Streams adds $0.004/min** on top of voice — don't forget.
- **Cartesia Sonic-3** shipped but Sonic-2 remains cheapest and good-enough for phone voices.
- **Groq free tier** is 1,000 RPD — unusable for prod, fine for regression.
- **Gemini Flash free tier trains on your data** — not usable for HIPAA/regulated call-center data in dev either.
- **AssemblyAI bills session duration**, not audio — idle streams cost money; Nova-3 wins on per-audio-second billing.
- **Supabase free projects pause** after 1 week idle — schedule a cron ping.
- **Pipecat Cloud went GA** (managed) — use if you don't want to run Fly.io yourself.
- **LiveKit Agents 1.4** has built-in semantic turn detector + false-interruption recovery; parity with Pipecat on turn-taking; Pipecat edges ahead on Twilio Media Streams native support.

## Why Pipecat over LiveKit Agents (for this app)
- Native Twilio Media Streams WebSocket transport ships out-of-the-box.
- More modular frame-pipeline model — easier to inject RAG retrieval, tool calling, per-tenant guardrails.
- Free, Apache 2.0, no vendor lock-in.
- LiveKit is superior for WebRTC-first browser voice; less ideal when inbound phone is the primary channel.
