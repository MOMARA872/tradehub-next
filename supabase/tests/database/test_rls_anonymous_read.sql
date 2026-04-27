\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- Spec §8.6 RLS smoke test for trade offers.
--
-- Asserts:
--   * Anon CAN read trade offers (public visibility).
--   * Anon CAN read offer_items belonging to those trade offers.
--   * Anon CANNOT read cash offers (participant-only).
--   * Anon CANNOT INSERT offers — proposer-must-be-self policy blocks.
--   * Anon CANNOT INSERT offer_items — pending-own-offer policy blocks.
--   * Anon UPDATEs on offers affect zero rows (no UPDATE policy means
--     all client-side updates are silently filtered; status changes
--     must flow through SECURITY DEFINER functions, not direct UPDATE).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Block 1 (postgres superuser): seed one trade offer + one cash offer.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_trade_offer uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  -- Trade offer (should be public)
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_trade_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Cash offer (should be hidden from anon). Inserted as superuser to
  -- bypass RLS — the production cash flow has its own client path.
  insert into offers (listing_id, buyer_id, proposer_id, offer_type, status, offer_amount)
    values (v_camera, v_bob, v_bob, 'cash', 'pending', 100);
end $$;

-- ---------------------------------------------------------------------
-- Block 2 (anon): SELECT visibility checks.
-- ---------------------------------------------------------------------
set role anon;

do $$
declare
  v_trade_count int;
  v_cash_count  int;
  v_oitem_count int;
begin
  -- auth.uid() is NULL under anon — confirm setup.
  if auth.uid() is not null then
    raise exception 'expected anon auth.uid()=NULL, got %', auth.uid();
  end if;

  -- Trade offer should be visible
  select count(*) into v_trade_count from offers where offer_type = 'trade';
  if v_trade_count <> 1 then
    raise exception 'anon trade visibility wrong: % (expected 1)', v_trade_count;
  end if;

  -- Cash offer should be hidden
  select count(*) into v_cash_count from offers where offer_type = 'cash';
  if v_cash_count <> 0 then
    raise exception 'anon cash visibility wrong: % (expected 0)', v_cash_count;
  end if;

  -- offer_items belonging to the trade offer should be visible
  select count(*) into v_oitem_count from offer_items;
  if v_oitem_count <> 1 then
    raise exception 'anon offer_items visibility wrong: % (expected 1)', v_oitem_count;
  end if;

  raise notice 'PASS: anon SELECT — trade public, cash hidden, offer_items follow parent';
end $$;

-- ---------------------------------------------------------------------
-- Block 3 (anon): INSERT into offers must be blocked.
-- ---------------------------------------------------------------------
do $$
begin
  begin
    insert into offers (listing_id, buyer_id, proposer_id, offer_type, status)
      values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'trade', 'pending');
    raise exception 'TEST FAILED: anon INSERT into offers was allowed';
  exception when others then
    if sqlerrm like '%TEST FAILED%' then raise; end if;
    -- Expect the RLS row-violation message specifically; anything else
    -- means the INSERT got further than the proposer-self policy.
    if sqlerrm not like '%row-level security%' then
      raise exception 'wrong error (expected RLS rejection, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: anon INSERT into offers blocked by RLS';
end $$;

-- ---------------------------------------------------------------------
-- Block 4 (anon): UPDATE on offers must affect zero rows. Without an
-- UPDATE policy, RLS predicates evaluate "no rows" — the statement
-- succeeds but no rows are mutated.
-- ---------------------------------------------------------------------
do $$
declare
  v_target uuid;
  v_status_before text;
  v_status_after  text;
begin
  -- Find a target trade offer (visible to anon)
  select id, status into v_target, v_status_before
    from offers where offer_type = 'trade' limit 1;
  if v_target is null then
    raise exception 'fixture missing: anon should see one trade offer';
  end if;

  update offers set status = 'passed' where id = v_target;

  select status into v_status_after from offers where id = v_target;
  if v_status_after <> v_status_before then
    raise exception 'anon UPDATE was applied — status changed % -> %',
      v_status_before, v_status_after;
  end if;

  raise notice 'PASS: anon UPDATE on offers silently filtered (status preserved)';
end $$;

-- ---------------------------------------------------------------------
-- Block 5 (anon): INSERT into offer_items must be blocked.
-- ---------------------------------------------------------------------
do $$
begin
  begin
    insert into offer_items (offer_id, listing_id)
      values (gen_random_uuid(), gen_random_uuid());
    raise exception 'TEST FAILED: anon INSERT into offer_items was allowed';
  exception when others then
    if sqlerrm like '%TEST FAILED%' then raise; end if;
    if sqlerrm not like '%row-level security%' then
      raise exception 'wrong error (expected RLS rejection, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: anon INSERT into offer_items blocked by RLS';
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Cleanup (back as postgres)
-- ---------------------------------------------------------------------
do $$ begin perform _test_cleanup(); end $$;
