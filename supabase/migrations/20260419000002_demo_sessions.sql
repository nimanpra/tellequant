-- =============================================================================
-- demo_chat_sessions
-- Text-only demo conversations users can run on the Free plan to try an
-- agent end-to-end without placing a live call. One row per user-initiated
-- session; rate-limiting is done by counting rows per day per org.
-- =============================================================================

create table if not exists public.demo_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists demo_chat_sessions_org_day_idx
  on public.demo_chat_sessions (org_id, created_at desc);

alter table public.demo_chat_sessions enable row level security;

drop policy if exists demo_chat_sessions_member_read on public.demo_chat_sessions;
create policy demo_chat_sessions_member_read
  on public.demo_chat_sessions for select
  using (
    exists (
      select 1 from public.memberships m
      where m.org_id = demo_chat_sessions.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists demo_chat_sessions_member_write on public.demo_chat_sessions;
create policy demo_chat_sessions_member_write
  on public.demo_chat_sessions for all
  using (
    exists (
      select 1 from public.memberships m
      where m.org_id = demo_chat_sessions.org_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.org_id = demo_chat_sessions.org_id
        and m.user_id = auth.uid()
    )
  );
