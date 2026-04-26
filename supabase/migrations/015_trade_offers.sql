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

-- Drop old declined-only check; we'll add a richer one below.
-- Use "if exists" to match migration 008's pattern and survive partial replays.
alter table offers drop constraint if exists offers_status_check;

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

-- ============================================================
-- offer_items: structured items in a trade offer
-- offers.listing_id  = SELLER's listing being traded for
-- offer_items.listing_id = BUYER's listings being put up
-- ============================================================

create table offer_items (
  offer_id   uuid not null references offers(id)   on delete cascade,
  listing_id uuid not null references listings(id) on delete restrict,
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (offer_id, listing_id)
);

create index idx_offer_items_listing on offer_items(listing_id);

-- Cap of 5 items per offer.
-- Pinned search_path = public for consistency with set_updated_at and the
-- project pattern from migration 002.
create or replace function enforce_offer_item_cap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from offer_items where offer_id = new.offer_id) >= 5 then
    raise exception 'Trade offer cannot include more than 5 items';
  end if;
  return new;
end;
$$;

create trigger offer_items_cap before insert on offer_items
  for each row execute function enforce_offer_item_cap();

-- ============================================================
-- listings: add 'in_trade' status (between accept and complete)
-- Use "if exists" on the constraint drop to match migration 008's pattern
-- and survive partial replays.
-- ============================================================

-- IMPORTANT: 'paused' was added by migration 008 (Stripe billing — paused
-- when a pro subscription lapses). It MUST be preserved here. The Stripe
-- webhook in app/api/webhooks/stripe/route.ts reads/writes status='paused'.
alter table listings drop constraint if exists listings_status_check;
alter table listings add constraint listings_status_check
  check (status in ('active', 'sold', 'expired', 'paused', 'in_trade'));

-- ============================================================
-- threads: pin an offer to a thread (for accepted trades)
-- ============================================================

alter table threads
  add column pinned_offer_id uuid references offers(id) on delete set null;

create index idx_threads_pinned_offer on threads(pinned_offer_id);

-- ============================================================
-- notifications: add 7 trade-offer notification types
-- Use "if exists" on the constraint drop to match migration 008's pattern
-- and survive partial replays.
-- ============================================================

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in (
    -- existing types (preserved)
    'offer_received', 'offer_accepted', 'offer_declined', 'offer_countered',
    'new_message_thread', 'new_message', 'review_received',
    -- new trade-offer types
    'trade_offer_received',
    'trade_offer_countered',
    'trade_offer_accepted',
    'trade_offer_passed',
    'trade_offer_auto_passed',
    'trade_offer_withdrawn',
    'trade_offer_completed'
  ));
