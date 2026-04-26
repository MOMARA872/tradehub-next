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
-- Attach to any table that has an `updated_at timestamptz` column.
-- Pinned search_path = public matches the project pattern from migration 002.
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- offers table extensions
-- ============================================================

-- Drop old declined-only check; we'll add a richer one below
alter table offers drop constraint offers_status_check;

-- Migrate existing 'declined' rows to 'passed' (no-rejection policy)
update offers set status = 'passed' where status = 'declined';

-- New columns
alter table offers
  add column offer_type      text not null default 'cash'
    check (offer_type in ('cash', 'trade')),
  add column proposer_id     uuid references profiles(id) on delete cascade,
  add column parent_offer_id uuid references offers(id)   on delete set null,
  add column updated_at      timestamptz not null default now(),
  add column completed_by_buyer  boolean not null default false,
  add column completed_by_seller boolean not null default false;

-- Backfill proposer_id for existing rows (cash offers were sent by the buyer)
update offers set proposer_id = buyer_id where proposer_id is null;
alter table offers alter column proposer_id set not null;

-- Richer status check (8 states)
alter table offers add constraint offers_status_check check (status in (
  'pending',
  'accepted',
  'countered',
  'passed',
  'auto_passed_listing',
  'auto_passed_item_taken',
  'withdrawn',
  'completed'
));

-- updated_at trigger
drop trigger if exists offers_set_updated_at on offers;
create trigger offers_set_updated_at
  before update on offers
  for each row execute function set_updated_at();

-- Indexes
create index if not exists idx_offers_parent         on offers(parent_offer_id);
create index if not exists idx_offers_proposer       on offers(proposer_id);
create index if not exists idx_offers_listing_status on offers(listing_id, status);
