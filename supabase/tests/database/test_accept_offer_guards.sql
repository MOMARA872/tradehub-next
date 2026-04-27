\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- Isolated rejection-path tests for accept_offer().
--
-- Each block sets up a fixture that violates EXACTLY ONE guard, then
-- asserts the EXACT error message substring (no OR-matching). A real
-- function bug would be either a wrong rejection message or the call
-- succeeding when it must not.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Guard 1: Authentication required
--   Fixture: pending offer exists; jwt.claim.sub cleared so auth.uid()
--   returns NULL. All other inputs valid.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Clear JWT — auth.uid() now returns NULL
  perform set_config('request.jwt.claim.sub', '', true);

  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: accept_offer succeeded with no auth';
  exception when others then
    if sqlerrm not like '%Authentication required%' then
      raise exception 'wrong error (expected auth guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: accept_offer guard 1 (auth required)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 2: Offer not found
--   Fixture: caller is authenticated; passed offer_id is a random UUID
--   that does not exist. All other state irrelevant.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  perform set_config('request.jwt.claim.sub', v_alice::text, true);

  begin
    perform accept_offer(gen_random_uuid());
    raise exception 'TEST FAILED: accept_offer succeeded with nonexistent offer';
  exception when others then
    if sqlerrm not like '%Offer not found%' then
      raise exception 'wrong error (expected not-found guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: accept_offer guard 2 (offer not found)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 3: Offer is not pending
--   Fixture: a valid offer that has already transitioned to 'accepted'
--   via a prior successful accept_offer() call. Caller is the listing
--   owner so the only failing guard is the status check.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);  -- now 'accepted'

  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: accept_offer succeeded twice on same offer';
  exception when others then
    if sqlerrm not like '%Offer is not pending%' then
      raise exception 'wrong error (expected status guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: accept_offer guard 3 (wrong status)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 4: Listing not found (I1 defensive null-owner guard)
--   Fixture: pending offer exists, then the referenced listing row is
--   removed via session_replication_role=replica to bypass FK cascade.
--   The offer row is left with a dangling listing_id pointer, so the
--   function's `select user_id from listings` returns no row → v_owner
--   is NULL. All other guards pass (auth set, offer found, pending).
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Bypass FK cascade + offer_items RESTRICT to orphan the offer.
  -- offer_items rows here point at the offered bike, not the camera, so
  -- only the listings DELETE has an actual effect; replica role lets it
  -- skip the RESTRICT trigger that would otherwise block the unrelated
  -- bike→offer_items reference check anyway.
  set local session_replication_role = replica;
  delete from listings where id = v_camera;
  set local session_replication_role = origin;

  perform set_config('request.jwt.claim.sub', v_alice::text, true);

  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: accept_offer succeeded with missing listing';
  exception when others then
    if sqlerrm not like '%Listing not found%' then
      raise exception 'wrong error (expected I1 null-owner guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: accept_offer guard 4 (I1 null-owner)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 5: Only the listing owner can accept
--   Fixture: pending offer exists; caller is a third party who is
--   neither the listing owner nor the offer's buyer. Auth set, offer
--   found, pending status, listing owner non-null — only the ownership
--   check fails.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
begin
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_bob     := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera  := _test_create_listing(v_alice, 'Camera');
  v_bike    := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  perform set_config('request.jwt.claim.sub', v_charlie::text, true);

  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: non-owner accept was allowed';
  exception when others then
    if sqlerrm not like '%Only the listing owner can accept%' then
      raise exception 'wrong error (expected ownership guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: accept_offer guard 5 (non-owner)';
  perform _test_cleanup();
end $$;
