\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- Isolated rejection-path tests for mark_offer_complete().
--
-- Each block sets up a fixture that violates EXACTLY ONE guard, then
-- asserts the EXACT error message substring (no OR-matching).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Guard 1: Authentication required
--   Fixture: an accepted offer exists; jwt.claim.sub cleared so
--   auth.uid() returns NULL. All other inputs valid.
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
  perform accept_offer(v_offer);

  perform set_config('request.jwt.claim.sub', '', true);

  begin
    perform mark_offer_complete(v_offer);
    raise exception 'TEST FAILED: mark_offer_complete succeeded with no auth';
  exception when others then
    if sqlerrm not like '%Authentication required%' then
      raise exception 'wrong error (expected auth guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: mark_offer_complete guard 1 (auth required)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 2: Offer not found
--   Fixture: caller is authenticated; passed offer_id is a random UUID.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  perform set_config('request.jwt.claim.sub', v_alice::text, true);

  begin
    perform mark_offer_complete(gen_random_uuid());
    raise exception 'TEST FAILED: mark_offer_complete succeeded with nonexistent offer';
  exception when others then
    if sqlerrm not like '%Offer not found%' then
      raise exception 'wrong error (expected not-found guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: mark_offer_complete guard 2 (offer not found)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 3: Offer is not in accepted state
--   Fixture: a valid offer that has never been accepted (still
--   'pending'). Caller is the buyer (a participant) so the only
--   failing guard is the status check.
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
  -- Intentionally NOT accepting

  begin
    perform mark_offer_complete(v_offer);
    raise exception 'TEST FAILED: mark_offer_complete succeeded on pending offer';
  exception when others then
    if sqlerrm not like '%Offer is not in accepted state%' then
      raise exception 'wrong error (expected status guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: mark_offer_complete guard 3 (wrong status)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 4: Listing not found (defensive null-owner guard)
--   Fixture: an accepted offer; remove the seller's listing row via
--   session_replication_role=replica to bypass FK cascade and the
--   offer_items RESTRICT FK. The offer survives with a dangling
--   listing_id, so v_owner becomes NULL and the participant check
--   would otherwise fall through three-valued logic without the guard.
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
  perform accept_offer(v_offer);

  -- Bypass FK cascade + offer_items RESTRICT. Also drop the threads row
  -- accept_offer just created — otherwise cleanup's `delete from offers`
  -- cascades a SET NULL on threads.pinned_offer_id, that UPDATE
  -- re-validates threads.listing_id, and the dangling listing trips
  -- threads_listing_id_fkey unrelated to what we're testing.
  set local session_replication_role = replica;
  delete from threads     where listing_id = v_camera;
  delete from listings    where id         = v_camera;
  set local session_replication_role = origin;

  begin
    perform mark_offer_complete(v_offer);
    raise exception 'TEST FAILED: mark_offer_complete succeeded with missing listing';
  exception when others then
    if sqlerrm not like '%Listing not found%' then
      raise exception 'wrong error (expected null-owner guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: mark_offer_complete guard 4 (null-owner)';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Guard 5: Only trade participants can mark complete
--   Fixture: an accepted offer; caller is a third party who is neither
--   the offer's buyer nor the listing owner. Auth set, offer found,
--   accepted status, listing owner non-null — only the participant
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
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);

  perform set_config('request.jwt.claim.sub', v_charlie::text, true);

  begin
    perform mark_offer_complete(v_offer);
    raise exception 'TEST FAILED: non-participant mark was allowed';
  exception when others then
    if sqlerrm not like '%Only trade participants can mark complete%' then
      raise exception 'wrong error (expected participant guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: mark_offer_complete guard 5 (non-participant)';
  perform _test_cleanup();
end $$;
