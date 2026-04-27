\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- Authenticated-read RLS hardening for spec §8.6.
--
-- The offers SELECT policy has four visibility branches:
--   1. offer_type = 'trade'        (public — exercised by anon test)
--   2. auth.uid() = buyer_id       (cash, buyer's view)
--   3. auth.uid() = proposer_id    (cash, proposer's view if ≠ buyer)
--   4. auth.uid() IN listing.user_id (cash, listing-owner's view)
--
-- The natural cash-offer fixture has buyer_id = proposer_id (the same
-- user is paying and proposing). To isolate branches 2 and 3 we seed a
-- second SYNTHETIC cash offer with buyer_id ≠ proposer_id — direct
-- INSERT bypasses the proposer-self INSERT policy. This shape doesn't
-- exist in production but it lets each policy branch fire alone.
--
-- Each block sets role=authenticated + a specific JWT claim and
-- asserts EXACT visibility counts — never an OR-match — so a regression
-- in any one branch surfaces as a wrong count.
-- =====================================================================

-- Stable canonical UUIDs accessible from both top-level SQL (via
-- set_config) and dollar-quoted DO blocks. psql `\set` does not
-- substitute inside DO blocks, so a SQL helper is the portable path.
create or replace function _test_uuid(p_name text)
returns uuid language sql immutable as $$
  select case p_name
    when 'alice'        then '00000000-0000-0000-0000-00000000a001'::uuid
    when 'bob'          then '00000000-0000-0000-0000-00000000b001'::uuid
    when 'carol'        then '00000000-0000-0000-0000-00000000c001'::uuid
    when 'dave'         then '00000000-0000-0000-0000-00000000d001'::uuid
    when 'camera'       then '00000000-0000-0000-0000-000000000111'::uuid
    when 'bike'         then '00000000-0000-0000-0000-000000000112'::uuid
    when 'trade'        then '00000000-0000-0000-0000-000000000211'::uuid
    when 'cash_normal'  then '00000000-0000-0000-0000-000000000311'::uuid
    when 'cash_split'   then '00000000-0000-0000-0000-000000000312'::uuid
  end
$$;

create or replace function _test_create_user_with_id(p_id uuid, p_name text)
returns uuid language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at,
                          aud, role, instance_id)
  values (p_id, p_name || '@test.local', jsonb_build_object('full_name', p_name),
          now(), now(), 'authenticated', 'authenticated',
          '00000000-0000-0000-0000-000000000000');
  return p_id;
end $$;

-- ---------------------------------------------------------------------
-- Block 0 (postgres): seed users, listings, one trade offer, two cash
-- offers (one normal, one split-identity).
-- ---------------------------------------------------------------------
do $$
begin
  perform _test_cleanup();

  perform _test_create_user_with_id(_test_uuid('alice'), 'alice');
  perform _test_create_user_with_id(_test_uuid('bob'),   'bob');
  perform _test_create_user_with_id(_test_uuid('carol'), 'carol');
  perform _test_create_user_with_id(_test_uuid('dave'),  'dave');

  perform _test_ensure_category();
  insert into listings (id, user_id, category_id, title, price, price_type)
    values (_test_uuid('camera'), _test_uuid('alice'), 'test-cat', 'Camera', 0, 'trade');
  insert into listings (id, user_id, category_id, title, price, price_type)
    values (_test_uuid('bike'),   _test_uuid('bob'),   'test-cat', 'Bike',   0, 'trade');

  -- Trade offer (public): bob offers his bike for alice's camera
  insert into offers (id, listing_id, buyer_id, proposer_id, offer_type, status)
    values (_test_uuid('trade'), _test_uuid('camera'), _test_uuid('bob'), _test_uuid('bob'),
            'trade', 'pending');
  insert into offer_items (offer_id, listing_id)
    values (_test_uuid('trade'), _test_uuid('bike'));

  -- Cash offer (normal — buyer = proposer = bob)
  insert into offers (id, listing_id, buyer_id, proposer_id, offer_type, status, offer_amount)
    values (_test_uuid('cash_normal'), _test_uuid('camera'),
            _test_uuid('bob'), _test_uuid('bob'), 'cash', 'pending', 100);

  -- Cash offer (split — buyer = bob, proposer = carol). Synthetic shape
  -- to isolate buyer_id and proposer_id branches from each other.
  insert into offers (id, listing_id, buyer_id, proposer_id, offer_type, status, offer_amount)
    values (_test_uuid('cash_split'), _test_uuid('camera'),
            _test_uuid('bob'), _test_uuid('carol'), 'cash', 'pending', 50);
end $$;

-- ---------------------------------------------------------------------
-- Block A — bob authenticated.
-- bob is buyer of v_cash_normal (also proposer there), buyer of
-- v_cash_split (proposer is carol), and proposer of v_trade.
-- Expected visibility: v_trade, v_cash_normal, v_cash_split (3 offers).
-- ---------------------------------------------------------------------
set role authenticated;

do $$
declare
  v_total int; v_trade_seen int; v_cash_normal_seen int; v_cash_split_seen int;
begin
  perform set_config('request.jwt.claim.sub', _test_uuid('bob')::text, true);

  if auth.uid() <> _test_uuid('bob') then
    raise exception 'jwt setup wrong: auth.uid()=%', auth.uid();
  end if;

  select count(*) into v_total from offers;
  if v_total <> 3 then raise exception 'bob sees %, expected 3', v_total; end if;

  select count(*) into v_trade_seen       from offers where id = _test_uuid('trade');
  select count(*) into v_cash_normal_seen from offers where id = _test_uuid('cash_normal');
  select count(*) into v_cash_split_seen  from offers where id = _test_uuid('cash_split');
  if v_trade_seen       <> 1 then raise exception 'bob trade'; end if;
  if v_cash_normal_seen <> 1 then raise exception 'bob cash_normal'; end if;
  if v_cash_split_seen  <> 1 then raise exception 'bob cash_split (buyer branch)'; end if;

  raise notice 'PASS: auth read — bob (buyer of split-cash, proposer/buyer of normal-cash, proposer of trade)';
end $$;

-- ---------------------------------------------------------------------
-- Block B — carol authenticated.
-- carol is the proposer of v_cash_split ONLY. Expected visibility:
-- v_trade (public) + v_cash_split (proposer branch). NOT v_cash_normal.
-- ---------------------------------------------------------------------
do $$
declare
  v_total int; v_cash_normal_seen int; v_cash_split_seen int;
begin
  perform set_config('request.jwt.claim.sub', _test_uuid('carol')::text, true);

  select count(*) into v_total            from offers;
  select count(*) into v_cash_normal_seen from offers where id = _test_uuid('cash_normal');
  select count(*) into v_cash_split_seen  from offers where id = _test_uuid('cash_split');

  if v_total <> 2 then
    raise exception 'carol sees %, expected 2 (trade + split-cash)', v_total;
  end if;
  if v_cash_normal_seen <> 0 then
    raise exception 'carol can see normal-cash she has no relation to';
  end if;
  if v_cash_split_seen <> 1 then
    raise exception 'carol cannot see split-cash she proposed';
  end if;

  raise notice 'PASS: auth read — carol (proposer-only branch isolates from buyer/owner)';
end $$;

-- ---------------------------------------------------------------------
-- Block C — alice authenticated.
-- alice owns the camera listing. She's not buyer or proposer of any
-- offer. Expected visibility: v_trade (public) + v_cash_normal (owner
-- branch) + v_cash_split (owner branch).
-- ---------------------------------------------------------------------
do $$
declare v_total int;
begin
  perform set_config('request.jwt.claim.sub', _test_uuid('alice')::text, true);

  select count(*) into v_total from offers;
  if v_total <> 3 then
    raise exception 'alice sees %, expected 3 (trade + 2 cash via owner branch)', v_total;
  end if;

  -- Confirm she sees both cash offers without being buyer or proposer
  if not exists (
    select 1 from offers
    where id = _test_uuid('cash_normal')
      and buyer_id <> _test_uuid('alice')
      and proposer_id <> _test_uuid('alice')
  ) then
    raise exception 'alice owner-branch lookup failed for normal-cash';
  end if;
  if not exists (
    select 1 from offers
    where id = _test_uuid('cash_split')
      and buyer_id <> _test_uuid('alice')
      and proposer_id <> _test_uuid('alice')
  ) then
    raise exception 'alice owner-branch lookup failed for split-cash';
  end if;

  raise notice 'PASS: auth read — alice (listing-owner branch, neither buyer nor proposer)';
end $$;

-- ---------------------------------------------------------------------
-- Block D — dave authenticated.
-- dave has no relationship to any offer. Expected visibility: only
-- v_trade (public). Both cash offers must be hidden.
-- ---------------------------------------------------------------------
do $$
declare
  v_total int; v_trade_seen int; v_cash_count int;
begin
  perform set_config('request.jwt.claim.sub', _test_uuid('dave')::text, true);

  select count(*) into v_total       from offers;
  select count(*) into v_trade_seen  from offers where offer_type = 'trade';
  select count(*) into v_cash_count  from offers where offer_type = 'cash';

  if v_total      <> 1 then raise exception 'dave sees %, expected 1', v_total; end if;
  if v_trade_seen <> 1 then raise exception 'dave trade visibility wrong'; end if;
  if v_cash_count <> 0 then raise exception 'dave can see % cash offers (expected 0)', v_cash_count; end if;

  raise notice 'PASS: auth read — dave (third party, only trade-public visible)';
end $$;

-- ---------------------------------------------------------------------
-- Block E — offer_items follows parent offer visibility.
-- v_trade has one offer_item (the bike). Trade is public, so an
-- authenticated third party (dave) should still see exactly 1
-- offer_items row through the parent-public branch.
-- ---------------------------------------------------------------------
do $$
declare v_oi_count int;
begin
  perform set_config('request.jwt.claim.sub', _test_uuid('dave')::text, true);

  select count(*) into v_oi_count from offer_items;
  if v_oi_count <> 1 then
    raise exception 'dave offer_items count = % (expected 1 — trade-public branch)', v_oi_count;
  end if;
  raise notice 'PASS: auth read — offer_items inherit parent (trade-public) visibility';
end $$;

-- ---------------------------------------------------------------------
-- Block F — DELETE on offers + offer_items has no policy → zero rows.
-- bob is a participant on every offer here, so a SELECT-policy bug
-- alone could not explain a non-zero delete; only a DELETE policy
-- could. With no DELETE policy, all rows survive.
-- ---------------------------------------------------------------------
do $$
declare
  v_offers_before int; v_offers_after int;
  v_items_before  int; v_items_after  int;
begin
  perform set_config('request.jwt.claim.sub', _test_uuid('bob')::text, true);

  select count(*) into v_offers_before from offers;
  select count(*) into v_items_before  from offer_items;

  delete from offers      where buyer_id = _test_uuid('bob');
  delete from offer_items where offer_id = _test_uuid('trade');

  select count(*) into v_offers_after from offers;
  select count(*) into v_items_after  from offer_items;

  if v_offers_after <> v_offers_before then
    raise exception 'bob DELETE on offers removed % rows (expected 0)',
      v_offers_before - v_offers_after;
  end if;
  if v_items_after <> v_items_before then
    raise exception 'bob DELETE on offer_items removed % rows (expected 0)',
      v_items_before - v_items_after;
  end if;

  raise notice 'PASS: auth DELETE silently filtered (no policy → 0 rows)';
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Cleanup as postgres
-- ---------------------------------------------------------------------
do $$ begin perform _test_cleanup(); end $$;
drop function if exists _test_create_user_with_id(uuid, text);
drop function if exists _test_uuid(text);
