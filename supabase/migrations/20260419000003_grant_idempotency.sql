-- =============================================================================
-- Tighten grant_credits idempotency:
--   - Add a partial unique index on stripe_invoice_id so `invoice.paid`
--     subscription grants can no longer be double-credited on webhook retries.
--   - Update grant_credits to short-circuit if either the payment intent OR
--     the invoice ID has already produced a ledger row.
-- =============================================================================

create unique index if not exists credit_ledger_invoice_unique_idx
  on public.credit_ledger (stripe_invoice_id)
  where stripe_invoice_id is not null;

create or replace function public.grant_credits(
  p_org_id                   uuid,
  p_minutes                  int,
  p_reason                   text,
  p_stripe_payment_intent_id text default null,
  p_stripe_invoice_id        text default null,
  p_note                     text default null
) returns int
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

  -- Idempotency: same invoice must never grant credits twice.
  if p_stripe_invoice_id is not null then
    select id into v_existing from public.credit_ledger
      where stripe_invoice_id = p_stripe_invoice_id;
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
