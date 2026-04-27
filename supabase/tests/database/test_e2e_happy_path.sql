\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- E2E happy path: bob proposes a 2-item trade offer on alice's
-- camera, alice accepts, then both sides mark complete. Asserts the
-- full final state — offer status, completion flags, listings, thread,
-- offer_items, and the EXACT notification fan-out by type and
-- recipient. The plan's loose `count(*) >= 4` check is replaced with
-- exact-count assertions so a regression that adds an unexpected
-- notification (e.g. trigger double-fires on in_trade or sold) trips
-- this test instead of slipping through silently.
-- =====================================================================

do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid; v_helmet uuid;
  v_offer uuid;
  v_thread_id uuid;

  v_offer_status text;
  v_completed_buyer boolean; v_completed_seller boolean;
  v_camera_status text; v_bike_status text; v_helmet_status text;
  v_offer_items_count int;
  v_total_notifications int;
  v_received_count int; v_accepted_count int; v_completed_count int;
  v_alice_received int; v_alice_completed int;
  v_bob_accepted int;  v_bob_completed int;
  v_unexpected_count int;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_helmet := _test_create_listing(v_bob, 'Helmet');

  ---------------------------------------------------------------------
  -- 1. Bob sends a trade offer (camera ⇄ bike + helmet)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike, v_helmet], 'fair?');

  ---------------------------------------------------------------------
  -- 2. Alice accepts
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);

  ---------------------------------------------------------------------
  -- 3. Bob marks complete (first side — should NOT flip status yet)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform mark_offer_complete(v_offer);

  if (select status from offers where id = v_offer) <> 'accepted' then
    raise exception 'offer flipped early after only one mark_complete: %',
      (select status from offers where id = v_offer);
  end if;
  if (select status from listings where id = v_camera) <> 'in_trade' then
    raise exception 'camera flipped to sold after only one mark_complete';
  end if;

  ---------------------------------------------------------------------
  -- 4. Alice marks complete (second side — flips to completed/sold)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform mark_offer_complete(v_offer);

  ---------------------------------------------------------------------
  -- Final-state assertions: offer
  ---------------------------------------------------------------------
  select status, completed_by_buyer, completed_by_seller
    into v_offer_status, v_completed_buyer, v_completed_seller
    from offers where id = v_offer;
  if v_offer_status     <> 'completed' then raise exception 'offer.status=%',     v_offer_status; end if;
  if v_completed_buyer  is not true    then raise exception 'completed_by_buyer not true'; end if;
  if v_completed_seller is not true    then raise exception 'completed_by_seller not true'; end if;

  -- offer_items: exactly the bike + helmet rows persisted
  select count(*) into v_offer_items_count from offer_items where offer_id = v_offer;
  if v_offer_items_count <> 2 then
    raise exception 'offer_items rows = % (expected 2)', v_offer_items_count;
  end if;
  if not exists (select 1 from offer_items where offer_id = v_offer and listing_id = v_bike) then
    raise exception 'bike offer_item missing';
  end if;
  if not exists (select 1 from offer_items where offer_id = v_offer and listing_id = v_helmet) then
    raise exception 'helmet offer_item missing';
  end if;

  ---------------------------------------------------------------------
  -- Final-state assertions: listings (all three flip to 'sold')
  ---------------------------------------------------------------------
  select status into v_camera_status from listings where id = v_camera;
  select status into v_bike_status   from listings where id = v_bike;
  select status into v_helmet_status from listings where id = v_helmet;
  if v_camera_status <> 'sold' then raise exception 'camera=%', v_camera_status; end if;
  if v_bike_status   <> 'sold' then raise exception 'bike=%',   v_bike_status; end if;
  if v_helmet_status <> 'sold' then raise exception 'helmet=%', v_helmet_status; end if;

  ---------------------------------------------------------------------
  -- Thread / pinned_offer
  ---------------------------------------------------------------------
  select id into v_thread_id from threads
    where listing_id = v_camera
      and buyer_id   = v_bob
      and seller_id  = v_alice
      and pinned_offer_id = v_offer;
  if v_thread_id is null then raise exception 'thread missing or pin wrong'; end if;

  -- Listing title was snapshot at thread creation time
  if (select listing_title from threads where id = v_thread_id) <> 'Camera' then
    raise exception 'thread.listing_title not snapshot to Camera';
  end if;

  ---------------------------------------------------------------------
  -- Notification fan-out — EXACT counts by type and per recipient
  ---------------------------------------------------------------------
  select count(*) into v_total_notifications from notifications;
  if v_total_notifications <> 4 then
    raise exception 'total notifications = % (expected exactly 4)', v_total_notifications;
  end if;

  select count(*) into v_received_count  from notifications where type = 'trade_offer_received';
  select count(*) into v_accepted_count  from notifications where type = 'trade_offer_accepted';
  select count(*) into v_completed_count from notifications where type = 'trade_offer_completed';
  if v_received_count  <> 1 then raise exception 'trade_offer_received=%',  v_received_count; end if;
  if v_accepted_count  <> 1 then raise exception 'trade_offer_accepted=%',  v_accepted_count; end if;
  if v_completed_count <> 2 then raise exception 'trade_offer_completed=%', v_completed_count; end if;

  -- Alice (seller): received + completed
  select count(*) into v_alice_received from notifications
    where user_id = v_alice and type = 'trade_offer_received';
  select count(*) into v_alice_completed from notifications
    where user_id = v_alice and type = 'trade_offer_completed';
  if v_alice_received  <> 1 then raise exception 'alice received=%',  v_alice_received; end if;
  if v_alice_completed <> 1 then raise exception 'alice completed=%', v_alice_completed; end if;

  -- Bob (buyer): accepted + completed
  select count(*) into v_bob_accepted from notifications
    where user_id = v_bob and type = 'trade_offer_accepted';
  select count(*) into v_bob_completed from notifications
    where user_id = v_bob and type = 'trade_offer_completed';
  if v_bob_accepted  <> 1 then raise exception 'bob accepted=%',  v_bob_accepted; end if;
  if v_bob_completed <> 1 then raise exception 'bob completed=%', v_bob_completed; end if;

  -- No spurious auto-pass notifications: the listing-status trigger
  -- fires on the in_trade->sold flip but must find no pending siblings.
  select count(*) into v_unexpected_count from notifications
    where type = 'trade_offer_auto_passed';
  if v_unexpected_count <> 0 then
    raise exception 'unexpected % auto-pass notifications in happy path', v_unexpected_count;
  end if;

  raise notice 'PASS: e2e happy path — offer/listings/thread/notifications all final';
  perform _test_cleanup();
end $$;
