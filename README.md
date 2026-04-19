# Tellequant

**AI call center for every business.** Upload your docs, configure a persona, point a phone
number at it — Tellequant answers every inbound call and runs autonomous outbound campaigns,
backed by your own RAG.

Self-hosted, provider-agnostic, built on open components. Target cost: **$0.05 per minute**
(vs. Retell at $0.07+ and Microsoft Call-Center-AI on Azure at $0.20+).

---

## Architecture

```
┌────────────┐    ┌────────────────┐    ┌────────────────────┐
│  Caller    │◄──►│ Twilio (PSTN)  │◄──►│  Voice Worker      │
└────────────┘    └────────────────┘    │  (Python, Pipecat) │
                         ▲              │                    │
                         │ TwiML        │  • Deepgram STT    │
                         │              │  • Gemini / Groq   │
┌───────────────────────────────────┐   │  • Deepgram TTS    │
│  Next.js 15 App Router            │◄──┤  • RAG tool calls  │
│  • Marketing site                 │   └────────────────────┘
│  • Dashboard (agents, KB, logs)   │             │
│  • /api (webhooks + worker API)   │   HMAC-signed │
└───────────────────────────────────┘             ▼
                  │                    ┌────────────────────┐
                  │  RLS / pgvector    │  Supabase          │
                  └───────────────────►│  Postgres + Storage│
                                       └────────────────────┘
```

### Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 15, React 19, Tailwind v4 | App Router, Server Components, RSC streaming |
| Auth & DB | Supabase (Postgres + pgvector + Storage + RLS) | Multi-tenant with row-level security out of the box |
| LLM | Gemini 2.5 Flash (default), Groq Llama 3.3, GPT-4o-mini | Free tier on Gemini; Groq = 500+ tok/s; all swappable |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dim) | $0.02/M tokens, industry standard |
| STT | Deepgram Nova-3 | $0.0043/min, best-in-class real-time accuracy |
| TTS | Deepgram Aura-2, Cartesia Sonic-2 | Sub-300ms latency, natural sounding |
| Telephony | Twilio Media Streams | $1/mo/number + $0.0085/min inbound |
| Voice orchestration | [Pipecat](https://pipecat.ai) | Open-source, handles turn-taking & barge-in |

---

## Quick start (local dev)

### 1. Prereqs

- Node.js 20+, pnpm or bun
- Python 3.11+
- Supabase CLI (`brew install supabase/tap/supabase`)
- [ngrok](https://ngrok.com) or Cloudflare Tunnel (to expose the worker to Twilio)

### 2. Clone and install

```bash
git clone https://github.com/your-org/tellequant && cd tellequant
bun install                       # or: npm install
cd worker && pip install -e . && cd ..
```

### 3. Sign up for providers

All have free tiers — you can get end-to-end working on $0:

| Provider | Free tier | Signup |
|---|---|---|
| [Supabase](https://supabase.com) | 500MB DB, 1GB storage, unlimited API | → create project, copy URL + anon + service role keys |
| [Deepgram](https://deepgram.com) | $200 free credit (~460 hours STT) | → `DEEPGRAM_API_KEY` |
| [Google AI Studio](https://aistudio.google.com) | 1,500 req/day free for Gemini 2.5 Flash | → `GEMINI_API_KEY` |
| [OpenAI](https://platform.openai.com) | Pay-as-you-go (embeddings are ~$0.02/M tokens) | → `OPENAI_API_KEY` |
| [Twilio](https://twilio.com) | $15 trial credit | → SID + auth token, buy a number (~$1/mo) |

Optional:
- [Groq](https://groq.com) — insanely fast LLM inference, free for now
- [Cartesia](https://cartesia.ai) — alternate TTS with great voices

### 4. Environment

```bash
cp .env.example .env.local
cp worker/.env.example worker/.env
# fill in all the keys from step 3
# generate a strong shared secret:
openssl rand -hex 32   # paste the same value into VOICE_WORKER_SHARED_SECRET in BOTH files
```

### 5. Database

```bash
supabase link --project-ref <your-project-ref>
supabase db push           # runs supabase/migrations/*.sql
```

This creates every table (`organizations`, `agents`, `knowledge_bases`, `chunks`, `calls`,
`call_events` …), the `match_chunks` RPC for RAG, and RLS policies enforcing multi-tenancy.

### 6. Run the app

```bash
bun run dev                # Next.js on :3000
```

In a second terminal:

```bash
bun run worker             # Python worker on :8787
```

In a third terminal, expose the worker to the internet so Twilio can reach it:

```bash
ngrok http 8787
# copy the https:// URL, e.g. https://abc123.ngrok.app
# convert to wss:// + /twilio path, then set:
#   VOICE_WORKER_WS_URL=wss://abc123.ngrok.app/twilio
# in .env.local and restart the Next.js dev server
```

### 7. Wire a phone number

1. Open the dashboard at http://localhost:3000
2. Sign up → create a workspace
3. **Knowledge base** → upload a PDF → wait for status `ready`
4. **Agents** → new agent → pick the KB you just uploaded
5. **Phone numbers** → buy a Twilio number → attach the agent
6. In the Twilio console, set the number's **A call comes in** webhook to:
   `https://<your-ngrok>.ngrok.app/api/twilio/voice` (POST)
7. Call the number. Tellequant picks up, says the opening line, searches your KB, and answers.

---

## Production deployment

### Web app → Vercel

```bash
vercel                     # first time
vercel env pull .env.local # sync env vars
vercel --prod              # deploy
```

Vercel auto-detects Next.js 15. Set all `.env.local` values in the Vercel project's
**Environment Variables** tab. Make sure `NEXT_PUBLIC_APP_URL` points at your production
domain.

### Worker → Fly.io / Railway / any Docker host

```bash
cd worker
docker build -t tellequant-worker .
# then deploy to your platform of choice:
fly launch                 # or railway up, or kubectl apply
```

Or use the included `docker-compose.yml` from the repo root:

```bash
docker compose up -d worker
```

The worker must be reachable from Twilio at a wss:// URL. Set
`VOICE_WORKER_WS_URL=wss://worker.yourdomain.com/twilio` in the Next.js env.

### Supabase

Free tier is fine to start (500MB DB + 1GB storage). Upgrade to the $25/mo Pro tier when
you have real users — you get daily backups, point-in-time recovery, and 8GB DB.

The `pgvector` ivfflat index on `chunks.embedding` is tuned for ~1M chunks. For 10M+,
rebuild with more lists:

```sql
reindex index chunks_embedding_idx;
-- or recreate with higher list count:
drop index chunks_embedding_idx;
create index chunks_embedding_idx on public.chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 400);
```

---

## Feature checklist

- [x] Multi-tenant auth (Supabase, RLS, magic link + password)
- [x] Knowledge base ingestion (PDF / TXT / MD / HTML) → chunk → embed → pgvector
- [x] Agent builder (persona, voice, LLM, tools, max duration)
- [x] Phone number marketplace (Twilio search + purchase)
- [x] Outbound campaigns (CSV upload → autonomous dialer with concurrency control)
- [x] Inbound call handling (Twilio `<Stream>` → Pipecat pipeline → RAG-powered LLM)
- [x] Call logs with synced transcript playback, AI summary, sentiment, tool-call timeline
- [x] CSV export per campaign
- [x] Analytics (30-day rolling: calls/day, answer rate, sentiment breakdown, cost)
- [x] API keys (HMAC-based auth for external integrations)
- [ ] Stripe metered billing (scaffold present, wiring TODO)
- [ ] HIPAA BAA workflow (legal + DB encryption at rest is scaffold-ready)

---

## Project layout

```
tellequant/
├── src/
│   ├── app/
│   │   ├── (marketing)/       # Landing page
│   │   ├── (auth)/            # /signin, /signup, /onboarding
│   │   ├── (dashboard)/       # /dashboard/{agents,knowledge,numbers,campaigns,calls,…}
│   │   └── api/               # All API routes + Twilio webhooks + worker callbacks
│   ├── components/
│   │   ├── marketing/         # Hero, live-call demo, pricing
│   │   ├── dashboard/         # Agent form, CSV uploader, call transcript, …
│   │   ├── ui/                # Button, Card, Input, Select, …
│   │   └── brand/             # Logo
│   └── lib/
│       ├── supabase/          # server/client/middleware helpers, types
│       ├── rag/               # chunk, embed, search
│       ├── telephony/         # Twilio number purchase
│       ├── worker-auth.ts     # HMAC verify for worker → API callbacks
│       ├── catalog.ts         # VOICES, LLMS, BUILTIN_TOOLS
│       └── utils.ts           # cn, formatPhone, formatDuration, …
├── worker/                    # Python Pipecat voice worker
│   ├── tellequant_worker/
│   │   ├── main.py            # FastAPI WS server (/twilio) + dial loop
│   │   ├── pipeline.py        # Pipecat pipeline + tool handlers
│   │   ├── api_client.py      # HMAC-signed HTTP client
│   │   └── config.py
│   └── Dockerfile
├── supabase/
│   └── migrations/
│       └── 20260418000000_init.sql    # Full schema + RLS + RPCs + storage bucket
└── docker-compose.yml
```

---

## Cost per minute

Blended per-minute cost for an average call (assuming 50% user / 50% agent talk):

| Line item | Cost |
|---|---:|
| Twilio inbound | $0.0085/min |
| Deepgram Nova-3 STT | $0.0043/min |
| Gemini 2.5 Flash (≈500 tokens in + 150 out) | $0.0005/min |
| Deepgram Aura-2 TTS | $0.0100/min |
| **Total** | **~$0.023/min** |

Outbound adds ~$0.006 (Twilio long-distance). Your customer-facing price can comfortably
land at $0.05–0.10/min with healthy margin.

---

## Contributing

This repo is the reference implementation. Fork, white-label, deploy for your clients —
just leave the LICENSE in place.

```bash
bun run typecheck       # verify types
bun run build           # next build
cd worker && pytest     # (tests TBD)
```

---

## License

MIT — do whatever you want, just don't blame us when the robot books the wrong appointment.
