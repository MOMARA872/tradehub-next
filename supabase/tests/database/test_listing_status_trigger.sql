\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- Listing status trigger: auto-pass pending offers when a listing
-- transitions to 'sold' or 'expired'. Fires on the listing row update,
-- not from inside any stored function — so it must work for both the
-- mark_offer_complete() in_trade→sold path AND a seller manually
-- marking a listing 'expired'.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Block 1: seller marks listing 'expired' → pending offer ON that
--   listing becomes auto_passed_listing with notification.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Alice marks the camera as expired
  update listings set status = 'expired' where id = v_camera;

  select status into v_status from offers where id = v_offer;
  if v_status <> 'auto_passed_listing' then
    raise exception 'expected auto_passed_listing, got %', v_status;
  end if;

  if not exists (
    select 1 from notifications
    where user_id = v_bob
      and type = 'trade_offer_auto_passed'
      and title = 'Listing no longer available'
  ) then raise exception 'expired-listing notification missing'; end if;

  raise notice 'PASS: listing status trigger — expired auto-passes listing';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Block 2: seller marks listing 'expired' → other pending offers that
--   include this listing as an offered item become
--   auto_passed_item_taken with the item-side notification.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_dave uuid; v_bob uuid;
  v_camera uuid; v_phone uuid; v_bike uuid;
  v_offer_to_dave uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_dave  := _test_create_user('dave');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_phone  := _test_create_listing(v_dave, 'Phone');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  -- Bob offers his bike to Dave (offered_item = bike)
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_to_dave := create_trade_offer(v_phone, array[v_bike], '');

  -- Bob withdraws his bike by marking it expired
  update listings set status = 'expired' where id = v_bike;

  select status into v_status from offers where id = v_offer_to_dave;
  if v_status <> 'auto_passed_item_taken' then
    raise exception 'expected auto_passed_item_taken, got %', v_status;
  end if;

  if not exists (
    select 1 from notifications
    where user_id = v_bob
      and type = 'trade_offer_auto_passed'
      and title = 'Offered item no longer available'
  ) then raise exception 'item-expired notification missing'; end if;

  raise notice 'PASS: listing status trigger — expired item auto-passes overlap';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Block 3: transition into 'in_trade' (the accept_offer path) does
--   NOT fire the auto-pass loops. Without this guard the trigger
--   would double-process every accept.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid; v_bike uuid; v_lens uuid;
  v_offer_bob uuid; v_offer_charlie uuid;
  v_status_bob text; v_status_charlie text;
  v_autopass_count int;
begin
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_bob     := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera  := _test_create_listing(v_alice, 'Camera');
  v_bike    := _test_create_listing(v_bob, 'Bike');
  v_lens    := _test_create_listing(v_charlie, 'Lens');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_bob := create_trade_offer(v_camera, array[v_bike], '');
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_offer_charlie := create_trade_offer(v_camera, array[v_lens], '');

  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer_bob);

  -- Charlie's offer should be auto_passed_listing — but from accept_offer's
  -- own loop, NOT from the trigger (the trigger never sees the active→
  -- in_trade transition). Verify by checking the notification message:
  -- accept_offer uses 'Listing already traded'; trigger uses 'Listing no
  -- longer available'. If the trigger had fired on the in_trade flip,
  -- Charlie would have BOTH notifications (or any 'no longer available').
  select status into v_status_charlie from offers where id = v_offer_charlie;
  if v_status_charlie <> 'auto_passed_listing' then
    raise exception 'sibling status wrong: %', v_status_charlie;
  end if;

  -- Trigger-issued notification text MUST be absent for charlie
  if exists (
    select 1 from notifications
    where user_id = v_charlie
      and title = 'Listing no longer available'
  ) then raise exception 'trigger fired on active->in_trade transition'; end if;

  -- Exactly one auto-pass notification for charlie (from accept_offer)
  select count(*) into v_autopass_count from notifications
    where user_id = v_charlie and type = 'trade_offer_auto_passed';
  if v_autopass_count <> 1 then
    raise exception 'expected 1 auto-pass notification for charlie, got %', v_autopass_count;
  end if;

  raise notice 'PASS: listing status trigger — in_trade transition does not fire';
  perform _test_cleanup();
end $$;

-- ---------------------------------------------------------------------
-- Block 4: mark_offer_complete()'s in_trade→sold flip fires the
--   trigger, but by that point all sibling offers are already
--   auto_passed_*, so the trigger loops find no pending rows and
--   issue no extra notifications. Verify count of auto-pass
--   notifications stays at the accept_offer baseline.
-- ---------------------------------------------------------------------
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid; v_bike uuid; v_lens uuid;
  v_offer_bob uuid; v_offer_charlie uuid;
  v_autopass_before int; v_autopass_after int;
  v_camera_status text; v_bike_status text;
begin
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_bob     := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera  := _test_create_listing(v_alice, 'Camera');
  v_bike    := _test_create_listing(v_bob, 'Bike');
  v_lens    := _test_create_listing(v_charlie, 'Lens');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_bob := create_trade_offer(v_camera, array[v_bike], '');
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_offer_charlie := create_trade_offer(v_camera, array[v_lens], '');

  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer_bob);

  select count(*) into v_autopass_before from notifications
    where type = 'trade_offer_auto_passed';

  -- Both sides complete the trade (flips in_trade -> sold, fires trigger)
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform mark_offer_complete(v_offer_bob);
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform mark_offer_complete(v_offer_bob);

  select status into v_camera_status from listings where id = v_camera;
  select status into v_bike_status   from listings where id = v_bike;
  if v_camera_status <> 'sold' then raise exception 'camera=%', v_camera_status; end if;
  if v_bike_status   <> 'sold' then raise exception 'bike=%',   v_bike_status; end if;

  -- Trigger fired twice (one per listing flip), but found no pending offers
  select count(*) into v_autopass_after from notifications
    where type = 'trade_offer_auto_passed';
  if v_autopass_after <> v_autopass_before then
    raise exception 'mark_offer_complete trigger emitted % extra auto-pass notifications',
      v_autopass_after - v_autopass_before;
  end if;

  raise notice 'PASS: listing status trigger — mark_offer_complete sold flip is no-op';
  perform _test_cleanup();
end $$;
