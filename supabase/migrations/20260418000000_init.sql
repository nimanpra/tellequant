-- =============================================================================
-- Tellequant — initial schema. Postgres + pgvector + RLS.
-- Multi-tenant via organizations + memberships.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- organizations & memberships
-- ---------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  plan        text not null default 'free' check (plan in ('free','pro','scale')),
  created_at  timestamptz not null default now()
);
create index on public.organizations (owner_id);

create table public.memberships (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id)         on delete cascade,
  role        text not null default 'member' check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);
create index on public.memberships (user_id);

-- Helper: orgs the current user belongs to.
create or replace function public.current_user_org_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.memberships where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- knowledge bases, documents, chunks (RAG)
-- ---------------------------------------------------------------------------
create table public.knowledge_bases (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  embedding_model text not null default 'text-embedding-3-small',
  doc_count       int  not null default 0,
  chunk_count     int  not null default 0,
  created_at      timestamptz not null default now()
);
create index on public.knowledge_bases (org_id);

create table public.documents (
  id            uuid primary key default uuid_generate_v4(),
  kb_id         uuid not null references public.knowledge_bases(id) on delete cascade,
  name          text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  storage_path  text not null,
  status        text not null default 'pending' check (status in ('pending','processing','ready','failed')),
  error         text,
  created_at    timestamptz not null default now()
);
create index on public.documents (kb_id);
create index on public.documents (status);

create table public.chunks (
  id             uuid primary key default uuid_generate_v4(),
  kb_id          uuid not null references public.knowledge_bases(id) on delete cascade,
  document_id    uuid not null references public.documents(id) on delete cascade,
  content        text not null,
  token_count    int,
  chunk_index    int  not null,
  embedding      vector(1536),
  created_at     timestamptz not null default now()
);
create index chunks_kb_idx on public.chunks (kb_id);
create index chunks_doc_idx on public.chunks (document_id);
-- ivfflat for approximate NN (rebuild with: reindex index chunks_embedding_idx;)
create index chunks_embedding_idx on public.chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Similarity search helper (called from voice worker and API)
create or replace function public.match_chunks(
  query_embedding vector(1536),
  kb_id uuid,
  match_count int default 6
) returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable as $$
  select c.id, c.document_id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  where c.kb_id = match_chunks.kb_id
  order by c.embedding <=> query_embedding
  limit match_count
$$;

-- ---------------------------------------------------------------------------
-- agents
-- ---------------------------------------------------------------------------
create table public.agents (
  id                   uuid primary key default uuid_generate_v4(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  name                 text not null,
  persona              text not null default '',
  opening_line         text not null default 'Hi, this is an AI assistant. How can I help?',
  voice_provider       text not null default 'deepgram',
  voice_id             text not null default 'aura-2-thalia-en',
  llm_provider         text not null default 'groq',
  llm_model            text not null default 'llama-3.3-70b-versatile',
  temperature          numeric not null default 0.4,
  max_duration_seconds int not null default 600,
  knowledge_base_id    uuid references public.knowledge_bases(id) on delete set null,
  tools                jsonb not null default '[]'::jsonb,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on public.agents (org_id);

-- ---------------------------------------------------------------------------
-- phone numbers
-- ---------------------------------------------------------------------------
create table public.phone_numbers (
  id             uuid primary key default uuid_generate_v4(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  e164           text not null,
  friendly_name  text,
  provider       text not null default 'telnyx' check (provider in ('twilio','telnyx')),
  provider_sid   text,
  agent_id       uuid references public.agents(id) on delete set null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (provider, e164)
);
create index on public.phone_numbers (org_id);

-- ---------------------------------------------------------------------------
-- campaigns (outbound)
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id                    uuid primary key default uuid_generate_v4(),
  org_id                uuid not null references public.organizations(id) on delete cascade,
  name                  text not null,
  agent_id              uuid not null references public.agents(id),
  directive             text not null,
  from_number_id        uuid not null references public.phone_numbers(id),
  status                text not null default 'draft'
                        check (status in ('draft','scheduled','running','paused','completed','cancelled')),
  concurrency           int  not null default 3,
  retries               int  not null default 2,
  retry_delay_minutes   int  not null default 30,
  schedule_start        timestamptz,
  schedule_window_start time,
  schedule_window_end   time,
  total_contacts        int  not null default 0,
  completed_contacts    int  not null default 0,
  created_at            timestamptz not null default now()
);
create index on public.campaigns (org_id);

create table public.campaign_contacts (
  id            uuid primary key default uuid_generate_v4(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  name          text,
  phone         text not null,
  variables     jsonb not null default '{}'::jsonb,
  status        text not null default 'pending'
                check (status in ('pending','calling','done','failed','skipped')),
  attempts      int  not null default 0,
  last_call_id  uuid,
  outcome       text,
  created_at    timestamptz not null default now()
);
create index on public.campaign_contacts (campaign_id);
create index on public.campaign_contacts (status);

-- ---------------------------------------------------------------------------
-- calls
-- ---------------------------------------------------------------------------
create table public.calls (
  id                uuid primary key default uuid_generate_v4(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  agent_id          uuid references public.agents(id),
  phone_number_id   uuid references public.phone_numbers(id),
  campaign_id       uuid references public.campaigns(id),
  contact_id        uuid references public.campaign_contacts(id),
  direction         text not null check (direction in ('inbound','outbound')),
  from_number       text not null,
  to_number         text not null,
  status            text not null default 'queued'
                    check (status in ('queued','ringing','in_progress','completed','failed','no_answer')),
  started_at        timestamptz,
  ended_at          timestamptz,
  duration_seconds  int not null default 0,
  cost_cents        int not null default 0,
  recording_url     text,
  transcript_url    text,
  summary           text,
  outcome           text,
  sentiment         text check (sentiment in ('positive','neutral','negative')),
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);
create index on public.calls (org_id, created_at desc);
create index on public.calls (campaign_id);
create index on public.calls (agent_id);

create table public.call_events (
  id          uuid primary key default uuid_generate_v4(),
  call_id     uuid not null references public.calls(id) on delete cascade,
  at          timestamptz not null default now(),
  kind        text not null, -- 'user_speech','agent_speech','tool_call','tool_result','interruption','end_reason'
  payload     jsonb not null default '{}'::jsonb
);
create index on public.call_events (call_id, at);

-- ---------------------------------------------------------------------------
-- API keys (for worker & external use)
-- ---------------------------------------------------------------------------
create table public.api_keys (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  key_prefix  text not null,            -- visible first 8 chars
  key_hash    text not null,            -- sha256
  last_used   timestamptz,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index on public.api_keys (org_id);
create index on public.api_keys (key_prefix);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations     enable row level security;
alter table public.memberships       enable row level security;
alter table public.knowledge_bases   enable row level security;
alter table public.documents         enable row level security;
alter table public.chunks            enable row level security;
alter table public.agents            enable row level security;
alter table public.phone_numbers     enable row level security;
alter table public.campaigns         enable row level security;
alter table public.campaign_contacts enable row level security;
alter table public.calls             enable row level security;
alter table public.call_events       enable row level security;
alter table public.api_keys          enable row level security;

-- organizations: members can read; owners can update.
create policy "orgs_read" on public.organizations for select
  using (id in (select public.current_user_org_ids()));
create policy "orgs_insert_self" on public.organizations for insert
  with check (owner_id = auth.uid());
create policy "orgs_update_owner" on public.organizations for update
  using (owner_id = auth.uid());

-- memberships
create policy "memb_read" on public.memberships for select
  using (user_id = auth.uid() or org_id in (select public.current_user_org_ids()));
create policy "memb_insert" on public.memberships for insert
  with check (user_id = auth.uid());

-- tenant-scoped policies helper macro (generic READ+WRITE)
create policy "kb_rw"         on public.knowledge_bases   for all using (org_id in (select public.current_user_org_ids())) with check (org_id in (select public.current_user_org_ids()));
create policy "doc_rw"        on public.documents         for all using (kb_id in (select id from public.knowledge_bases where org_id in (select public.current_user_org_ids()))) with check (kb_id in (select id from public.knowledge_bases where org_id in (select public.current_user_org_ids())));
create policy "chunks_rw"     on public.chunks            for all using (kb_id in (select id from public.knowledge_bases where org_id in (select public.current_user_org_ids()))) with check (kb_id in (select id from public.knowledge_bases where org_id in (select public.current_user_org_ids())));
create policy "agents_rw"     on public.agents            for all using (org_id in (select public.current_user_org_ids())) with check (org_id in (select public.current_user_org_ids()));
create policy "phones_rw"     on public.phone_numbers     for all using (org_id in (select public.current_user_org_ids())) with check (org_id in (select public.current_user_org_ids()));
create policy "camp_rw"       on public.campaigns         for all using (org_id in (select public.current_user_org_ids())) with check (org_id in (select public.current_user_org_ids()));
create policy "camp_contacts" on public.campaign_contacts for all using (campaign_id in (select id from public.campaigns where org_id in (select public.current_user_org_ids()))) with check (campaign_id in (select id from public.campaigns where org_id in (select public.current_user_org_ids())));
create policy "calls_rw"      on public.calls             for all using (org_id in (select public.current_user_org_ids())) with check (org_id in (select public.current_user_org_ids()));
create policy "events_rw"     on public.call_events       for all using (call_id in (select id from public.calls where org_id in (select public.current_user_org_ids()))) with check (call_id in (select id from public.calls where org_id in (select public.current_user_org_ids())));
create policy "keys_rw"       on public.api_keys          for all using (org_id in (select public.current_user_org_ids())) with check (org_id in (select public.current_user_org_ids()));

-- ---------------------------------------------------------------------------
-- Triggers: keep doc/chunk counters fresh, bump updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger agents_updated_at before update on public.agents
  for each row execute function public.set_updated_at();

create or replace function public.bump_kb_counters() returns trigger language plpgsql as $$
begin
  if tg_table_name = 'documents' then
    if tg_op = 'INSERT' then
      update public.knowledge_bases set doc_count = doc_count + 1 where id = new.kb_id;
    elsif tg_op = 'DELETE' then
      update public.knowledge_bases set doc_count = greatest(0, doc_count - 1) where id = old.kb_id;
    end if;
  elsif tg_table_name = 'chunks' then
    if tg_op = 'INSERT' then
      update public.knowledge_bases set chunk_count = chunk_count + 1 where id = new.kb_id;
    elsif tg_op = 'DELETE' then
      update public.knowledge_bases set chunk_count = greatest(0, chunk_count - 1) where id = old.kb_id;
    end if;
  end if;
  return coalesce(new, old);
end $$;

create trigger doc_kb_count after insert or delete on public.documents
  for each row execute function public.bump_kb_counters();
create trigger chunk_kb_count after insert or delete on public.chunks
  for each row execute function public.bump_kb_counters();

-- ---------------------------------------------------------------------------
-- Storage bucket for RAG uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('kb-docs', 'kb-docs', false)
  on conflict (id) do nothing;

-- per-org access to kb-docs
create policy "kb-docs read own"  on storage.objects for select
  using (bucket_id = 'kb-docs' and (storage.foldername(name))[1] in (select public.current_user_org_ids()::text));
create policy "kb-docs write own" on storage.objects for insert
  with check (bucket_id = 'kb-docs' and (storage.foldername(name))[1] in (select public.current_user_org_ids()::text));
create policy "kb-docs delete own" on storage.objects for delete
  using (bucket_id = 'kb-docs' and (storage.foldername(name))[1] in (select public.current_user_org_ids()::text));
