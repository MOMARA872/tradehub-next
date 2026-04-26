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

-- ============================================================
-- RLS: offers
-- Trade offers are publicly readable (anyone, even logged out).
-- Cash offers stay participant-only.
-- All UPDATEs go through SECURITY DEFINER stored functions —
-- clients can never UPDATE offers directly.
-- Use "if exists" on policy drops to match the project pattern and
-- survive partial replays.
-- ============================================================

drop policy if exists "Offer participants can read offers" on offers;
drop policy if exists "Offer participants can update offers" on offers;

create policy "Trade offers public; cash offers participant-only"
  on offers for select using (
    offer_type = 'trade'
    or auth.uid() = buyer_id
    or auth.uid() = proposer_id
    or auth.uid() in (select user_id from listings where id = listing_id)
  );

-- Replace insert policy: proposer must be the authenticated user
drop policy if exists "Authenticated users can create offers" on offers;
create policy "Authenticated users can create offers as proposer"
  on offers for insert with check (auth.uid() = proposer_id);

-- ============================================================
-- RLS: offer_items
-- ============================================================

alter table offer_items enable row level security;

create policy "Offer items follow parent offer visibility"
  on offer_items for select using (
    exists (
      select 1 from offers o
      where o.id = offer_items.offer_id
        and (o.offer_type = 'trade'
             or auth.uid() = o.buyer_id
             or auth.uid() = o.proposer_id
             or auth.uid() in (select user_id from listings where id = o.listing_id))
    )
  );

create policy "Proposer can add items to own pending offer"
  on offer_items for insert with check (
    exists (
      select 1 from offers
      where id = offer_id and proposer_id = auth.uid() and status = 'pending'
    )
  );

-- ============================================================
-- create_trade_offer
-- Caller: authenticated user (the buyer/proposer)
-- ============================================================

create or replace function create_trade_offer(
  p_listing_id uuid,
  p_item_ids   uuid[],
  p_message    text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposer uuid := auth.uid();
  v_owner    uuid;
  v_offer_id uuid;
  v_item_id  uuid;
  v_pos      smallint := 0;
begin
  if v_proposer is null then
    raise exception 'Authentication required';
  end if;

  if array_length(p_item_ids, 1) is null or array_length(p_item_ids, 1) < 1 then
    raise exception 'Must include at least 1 item';
  end if;
  if array_length(p_item_ids, 1) > 5 then
    raise exception 'Cannot include more than 5 items';
  end if;
  -- Reject duplicate item UUIDs early — the offer_items composite PK
  -- (offer_id, listing_id) would otherwise raise an opaque constraint error.
  if array_length(p_item_ids, 1) <> (
    select count(distinct id) from unnest(p_item_ids) as u(id)
  )::int then
    raise exception 'Duplicate items in offer';
  end if;

  -- Validate target listing
  select user_id into v_owner from listings
    where id = p_listing_id and status = 'active'
    for update;
  if v_owner is null then
    raise exception 'Listing not found or not active';
  end if;
  if v_owner = v_proposer then
    raise exception 'Cannot make offer on your own listing';
  end if;

  -- Validate each offered item
  foreach v_item_id in array p_item_ids loop
    if not exists (
      select 1 from listings
      where id = v_item_id and user_id = v_proposer and status = 'active'
    ) then
      raise exception 'Item % is not yours or not active', v_item_id;
    end if;
  end loop;

  -- Insert offer
  insert into offers (
    listing_id, buyer_id, proposer_id, offer_type, status, message, offer_amount
  ) values (
    p_listing_id, v_proposer, v_proposer, 'trade', 'pending',
    coalesce(p_message, ''), 0
  ) returning id into v_offer_id;

  -- Insert items
  foreach v_item_id in array p_item_ids loop
    insert into offer_items (offer_id, listing_id, position)
    values (v_offer_id, v_item_id, v_pos);
    v_pos := v_pos + 1;
  end loop;

  -- Notify the listing owner
  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner, 'trade_offer_received',
    'New trade offer',
    'You have a new trade offer with ' || array_length(p_item_ids, 1) || ' item(s).',
    '/listings/' || p_listing_id || '/offers'
  );

  return v_offer_id;
end;
$$;

-- ============================================================
-- pass_offer — listing owner passes on an offer
-- ============================================================

create or replace function pass_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_listing_id uuid;
  v_owner      uuid;
  v_buyer      uuid;
  v_status     text;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select listing_id, buyer_id, status into v_listing_id, v_buyer, v_status
    from offers where id = p_offer_id for update;
  if v_status is null then raise exception 'Offer not found'; end if;
  if v_status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_status;
  end if;

  select user_id into v_owner from listings where id = v_listing_id;
  if v_owner <> v_caller then
    raise exception 'Only the listing owner can pass';
  end if;

  update offers set status = 'passed' where id = p_offer_id;

  insert into notifications (user_id, type, title, body, link)
  values (v_buyer, 'trade_offer_passed',
          'Offer passed',
          'The seller passed on your offer.',
          '/listings/' || v_listing_id || '#pass-list');
end;
$$;

-- ============================================================
-- withdraw_offer — proposer pulls back their own offer
-- ============================================================

create or replace function withdraw_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_proposer   uuid;
  v_buyer      uuid;
  v_status     text;
  v_listing_id uuid;
  v_owner      uuid;
  v_recipient  uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select proposer_id, buyer_id, status, listing_id
    into v_proposer, v_buyer, v_status, v_listing_id
    from offers where id = p_offer_id for update;
  if v_status is null then raise exception 'Offer not found'; end if;
  if v_status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_status;
  end if;
  if v_proposer <> v_caller then
    raise exception 'Only the proposer can withdraw';
  end if;

  update offers set status = 'withdrawn' where id = p_offer_id;

  -- Notify the OTHER party (not the withdrawer). For an original buyer offer
  -- the recipient is the listing owner. For a seller-sent counter, the
  -- recipient is the original buyer — avoids self-notification to the seller.
  select user_id into v_owner from listings where id = v_listing_id;
  v_recipient := case when v_caller = v_owner then v_buyer else v_owner end;

  insert into notifications (user_id, type, title, body, link)
  values (v_recipient, 'trade_offer_withdrawn',
          'Offer withdrawn',
          'A pending offer was withdrawn.',
          '/listings/' || v_listing_id || '/offers');
end;
$$;

-- ============================================================
-- counter_offer — receiver of a pending offer counters with a
-- new bundle of items (still drawn from the original buyer's listings).
-- ============================================================

create or replace function counter_offer(
  p_parent_offer_id uuid,
  p_item_ids        uuid[],
  p_message         text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_parent     offers%rowtype;
  v_owner      uuid;
  v_recipient  uuid;
  v_new_id     uuid;
  v_item_id    uuid;
  v_pos        smallint := 0;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  if array_length(p_item_ids, 1) is null or array_length(p_item_ids, 1) < 1 then
    raise exception 'Must include at least 1 item';
  end if;
  if array_length(p_item_ids, 1) > 5 then
    raise exception 'Cannot include more than 5 items';
  end if;
  -- Reject duplicate item UUIDs early — same guard as create_trade_offer.
  -- Without this, the offer_items composite PK (offer_id, listing_id)
  -- would otherwise raise an opaque constraint error.
  if array_length(p_item_ids, 1) <> (
    select count(distinct id) from unnest(p_item_ids) as u(id)
  )::int then
    raise exception 'Duplicate items in offer';
  end if;

  select * into v_parent from offers where id = p_parent_offer_id for update;
  if v_parent.id is null then raise exception 'Parent offer not found'; end if;
  if v_parent.status <> 'pending' then
    raise exception 'Parent is not pending (status=%)', v_parent.status;
  end if;
  if v_parent.offer_type <> 'trade' then
    raise exception 'Can only counter trade offers';
  end if;

  -- Receiver of this pending offer = whoever is NOT the proposer.
  -- For a chain: receiver alternates each link.
  select user_id into v_owner from listings where id = v_parent.listing_id;
  v_recipient := case
    when v_parent.proposer_id = v_owner then v_parent.buyer_id
    else v_owner
  end;
  if v_recipient <> v_caller then
    raise exception 'Only the receiver can counter';
  end if;

  -- Items must belong to the original buyer (the non-owner side) and be active
  foreach v_item_id in array p_item_ids loop
    if not exists (
      select 1 from listings
      where id = v_item_id and user_id = v_parent.buyer_id and status = 'active'
    ) then
      raise exception 'Item % is not active or not owned by the buyer', v_item_id;
    end if;
  end loop;

  -- Mark parent as countered
  update offers set status = 'countered' where id = v_parent.id;

  -- Insert the counter as a new pending offer
  insert into offers (
    listing_id, buyer_id, proposer_id, parent_offer_id,
    offer_type, status, message, offer_amount
  ) values (
    v_parent.listing_id, v_parent.buyer_id, v_caller, v_parent.id,
    'trade', 'pending', coalesce(p_message, ''), 0
  ) returning id into v_new_id;

  foreach v_item_id in array p_item_ids loop
    insert into offer_items (offer_id, listing_id, position)
    values (v_new_id, v_item_id, v_pos);
    v_pos := v_pos + 1;
  end loop;

  -- Notify the other party (= original proposer of parent)
  insert into notifications (user_id, type, title, body, link)
  values (v_parent.proposer_id, 'trade_offer_countered',
          'Counter offer',
          'You received a counter offer with ' ||
            array_length(p_item_ids, 1) || ' item(s).',
          '/trades/' || v_new_id);

  return v_new_id;
end;
$$;

-- ============================================================
-- accept_offer — listing owner accepts a pending offer.
-- Atomically: sets status, flips involved listings to 'in_trade',
-- creates/reuses a thread and pins the offer, notifies the buyer.
-- (Listing-wide and item-overlap auto-pass added in Tasks 15-16.)
-- ============================================================

create or replace function accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_offer      offers%rowtype;
  v_owner      uuid;
  v_thread_id  uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_offer from offers where id = p_offer_id for update;
  if v_offer.id is null then raise exception 'Offer not found'; end if;
  if v_offer.status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_offer.status;
  end if;

  select user_id into v_owner from listings where id = v_offer.listing_id;
  -- Defensive: a NULL v_owner would make `v_owner <> v_caller` evaluate to NULL
  -- (three-valued logic) which is falsy in IF — silently bypassing the
  -- ownership check. FK cascade should make this unreachable, but guard anyway.
  if v_owner is null then raise exception 'Listing not found'; end if;
  if v_owner <> v_caller then
    raise exception 'Only the listing owner can accept';
  end if;

  -- Set this offer accepted
  update offers set status = 'accepted' where id = v_offer.id;

  -- Flip the seller's listing + all offered items to 'in_trade'
  update listings set status = 'in_trade' where id = v_offer.listing_id;
  update listings set status = 'in_trade'
    where id in (select listing_id from offer_items where offer_id = v_offer.id);

  -- Create or reuse a thread between owner and buyer for this listing.
  -- On conflict, refresh both pinned_offer_id and listing_title so a thread
  -- created against an old listing title shows the current one.
  insert into threads (listing_id, buyer_id, seller_id, listing_title, pinned_offer_id)
    values (v_offer.listing_id, v_offer.buyer_id, v_owner,
            (select title from listings where id = v_offer.listing_id),
            v_offer.id)
    on conflict (listing_id, buyer_id) do update
      set pinned_offer_id = excluded.pinned_offer_id,
          listing_title   = excluded.listing_title
    returning id into v_thread_id;

  -- Notify buyer
  insert into notifications (user_id, type, title, body, link)
  values (v_offer.buyer_id, 'trade_offer_accepted',
          'Offer accepted!',
          'Your trade offer was accepted. Open the chat to coordinate.',
          '/threads/' || v_thread_id);
end;
$$;
