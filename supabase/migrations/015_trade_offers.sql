-- supabase/migrations/015_trade_offers.sql
-- Async Trade Offers — DB foundation
-- Spec: docs/superpowers/specs/2026-04-26-async-trade-offers-design.md
--
-- This migration extends the existing offers table with an offer_type
-- discriminator and adds offer_items, listing 'in_trade' status,
-- threads.pinned_offer_id, notification types, RLS, and 6 stored
-- functions for atomic state transitions.

-- ============================================================
-- Helper trigger function (re-usable)
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
