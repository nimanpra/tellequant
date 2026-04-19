-- =============================================================================
-- BYOK (bring-your-own-keys) + prepaid credits + self_host/cloud plan split.
-- Zero-marginal-cost economics: all provider API calls hit the user's keys;
-- platform revenue comes from subscriptions + prepaid minute credits.
-- =============================================================================

-- --- organizations: extend plan + add BYOK/credits columns ------------------

alter table public.organizations
  drop constraint if exists organizations_plan_check;

alter table public.organizations
  add column if not exists plan_type text not null default 'self_host'
    check (plan_type in ('self_host','cloud')),
  add column if not exists credits_balance_minutes int not null default 0,
  -- provider_keys_encrypted: jsonb object whose values are AES-256-GCM envelopes
  --   { "<provider_key_name>": { "v": "<b64 ciphertext>", "iv": "<b64 iv>", "t": "<b64 auth tag>" } }
  -- Only the Node encryption lib (src/lib/crypto.ts) ever decrypts these.
  add column if not exists provider_keys_encrypted jsonb not null default '{}'::jsonb;

alter table public.organizations
  add constraint organizations_plan_check
    check (plan in ('free','solo','team','business','pro','scale'));

alter table public.organizations
  add constraint organizations_credits_nonneg check (credits_balance_minutes >= 0);

-- --- credit ledger (audit trail + idempotency for webhooks) -----------------

create table if not exists public.credit_ledger (
  id                       uuid primary key default uuid_generate_v4(),
  org_id                   uuid not null references public.organizations(id) on delete cascade,
  delta_minutes            int  not null,
  balance_after            int  not null,
  reason                   text not null check (reason in (
    'credit_pack',
    'subscription_grant',
    'call_usage',
    'overage_billed',
    'admin_adjustment',
    'signup_bonus'
  )),
  stripe_payment_intent_id text unique,
  stripe_invoice_id        text,
  call_id                  uuid references public.calls(id) on delete set null,
  note                     text,
  created_at               timestamptz not null default now()
);
create index if not exists credit_ledger_org_idx on public.credit_ledger (org_id, created_at desc);

alter table public.credit_ledger enable row level security;
create policy "credit_ledger_read" on public.credit_ledger for select
  using (org_id in (select public.current_user_org_ids()));
-- writes flow exclusively through the service role (webhook + call-complete)

-- --- atomic credit-deduction function ---------------------------------------
-- Called from the call-complete webhook; guarantees no race between concurrent
-- calls competing for the last few minutes in the balance.

create or replace function public.deduct_credits(
  p_org_id     uuid,
  p_minutes    int,
  p_call_id    uuid,
  p_reason     text default 'call_usage'
) returns int -- returns new balance
language plpgsql security definer set search_path = public as $$
declare
  v_new_balance int;
begin
  if p_minutes <= 0 then
    select credits_balance_minutes into v_new_balance
      from public.organizations where id = p_org_id;
    return v_new_balance;
  end if;

  update public.organizations
    set credits_balance_minutes = greatest(0, credits_balance_minutes - p_minutes)
    where id = p_org_id
    returning credits_balance_minutes into v_new_balance;

  insert into public.credit_ledger (org_id, delta_minutes, balance_after, reason, call_id)
    values (p_org_id, -p_minutes, v_new_balance, p_reason, p_call_id);

  return v_new_balance;
end $$;

-- --- atomic credit-grant function -------------------------------------------

create or replace function public.grant_credits(
  p_org_id                   uuid,
  p_minutes                  int,
  p_reason                   text,
  p_stripe_payment_intent_id text default null,
  p_stripe_invoice_id        text default null,
  p_note                     text default null
) returns int -- returns new balance
language plpgsql security definer set search_path = public as $$
declare
  v_new_balance int;
  v_existing    uuid;
begin
  if p_minutes <= 0 then
    raise exception 'grant_credits requires positive minutes';
  end if;

  -- Idempotency: if we've already recorded this payment intent, no-op.
  if p_stripe_payment_intent_id is not null then
    select id into v_existing from public.credit_ledger
      where stripe_payment_intent_id = p_stripe_payment_intent_id;
    if v_existing is not null then
      select credits_balance_minutes into v_new_balance
        from public.organizations where id = p_org_id;
      return v_new_balance;
    end if;
  end if;

  update public.organizations
    set credits_balance_minutes = credits_balance_minutes + p_minutes
    where id = p_org_id
    returning credits_balance_minutes into v_new_balance;

  insert into public.credit_ledger
    (org_id, delta_minutes, balance_after, reason,
     stripe_payment_intent_id, stripe_invoice_id, note)
    values
    (p_org_id, p_minutes, v_new_balance, p_reason,
     p_stripe_payment_intent_id, p_stripe_invoice_id, p_note);

  return v_new_balance;
end $$;

-- --- default free signup bonus ----------------------------------------------
-- New orgs default to plan='free', plan_type='self_host', 0 credits.
-- Free tier has no live calls anyway — demo chat is text-only — so no bonus.

-- --- defaults update: agents switch baseline voice to Deepgram Aura ---------
-- Previous default (cartesia / sonic-english) cost ~$0.04/min; Aura is $0.015.
-- Only affects new agents; existing rows untouched.
alter table public.agents
  alter column voice_provider set default 'deepgram',
  alter column voice_id       set default 'aura-2-thalia-en';
