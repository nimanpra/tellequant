-- =============================================================================
-- Billing: Stripe subscription + customer links on organizations.
-- Per-call usage metering lives on public.calls.duration_seconds already.
-- =============================================================================

alter table public.organizations
  add column if not exists stripe_customer_id      text unique,
  add column if not exists stripe_subscription_id  text unique,
  add column if not exists subscription_status     text
    check (subscription_status in (
      'trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired'
    )),
  add column if not exists current_period_end      timestamptz;

create index if not exists organizations_stripe_customer_idx
  on public.organizations (stripe_customer_id);
