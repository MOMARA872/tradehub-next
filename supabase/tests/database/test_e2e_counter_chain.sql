\i supabase/tests/database/_helpers.sql

-- =====================================================================
-- E2E counter chain (3 links ending in accept).
--
--   o1: charlie creates trade offer on alice's camera with lens+tripod
--   o2: alice  counters     with lens+tripod+glasses ("add glasses")
--   o3: charlie counters back with lens+tripod        ("best i can do")
--   alice accepts o3
--
-- Key invariants verified end-to-end:
--   * buyer_id is preserved across every link (always the original
--     buyer = charlie). The chain represents one negotiation.
--   * proposer_id alternates each link (charlie → alice → charlie).
--   * The receiver of any pending offer = whoever is NOT its proposer;
--     only the receiver may counter, only the listing owner may accept.
--   * parent_offer_id forms a singly-linked chain back to o1.
--   * Status: o1='countered', o2='countered', o3='accepted'.
--   * Listings flip to 'in_trade' ONLY for items in the accepted link
--     (camera + lens + tripod). The unused glasses item, which appeared
--     only in o2, stays 'active'.
--   * Notifications: exact-count fan-out, no spurious auto-pass.
-- =====================================================================

do $$
declare
  v_alice uuid; v_charlie uuid;
  v_camera uuid; v_lens uuid; v_tripod uuid; v_glasses uuid;
  v_o1 uuid; v_o2 uuid; v_o3 uuid;

  v_o1_status text; v_o2_status text; v_o3_status text;
  v_o1_buyer uuid;  v_o2_buyer uuid;  v_o3_buyer uuid;
  v_o1_proposer uuid; v_o2_proposer uuid; v_o3_proposer uuid;
  v_o1_parent uuid; v_o2_parent uuid; v_o3_parent uuid;

  v_o1_items int; v_o2_items int; v_o3_items int;
  v_camera_status text; v_lens_status text; v_tripod_status text; v_glasses_status text;

  v_total_notif int;
  v_received_count int; v_countered_count int; v_accepted_count int; v_autopass_count int;
  v_alice_received int;  v_alice_countered int;
  v_charlie_countered int; v_charlie_accepted int;

  v_thread_id uuid;
begin
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_charlie := _test_create_user('charlie');
  v_camera  := _test_create_listing(v_alice,   'Camera');
  v_lens    := _test_create_listing(v_charlie, 'Lens');
  v_tripod  := _test_create_listing(v_charlie, 'Tripod');
  v_glasses := _test_create_listing(v_charlie, 'Sunglasses');

  ---------------------------------------------------------------------
  -- Link 1: charlie's original offer (lens + tripod)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_o1 := create_trade_offer(v_camera, array[v_lens, v_tripod], '');

  ---------------------------------------------------------------------
  -- Link 2: alice counters — adds glasses, parent = o1
  -- (alice is receiver of o1 because she owns the camera)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  v_o2 := counter_offer(v_o1, array[v_lens, v_tripod, v_glasses], 'add glasses');

  ---------------------------------------------------------------------
  -- Link 3: charlie counters back — drops glasses, parent = o2
  -- (charlie is receiver of o2 because alice was the proposer of o2)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_o3 := counter_offer(v_o2, array[v_lens, v_tripod], 'best i can do');

  ---------------------------------------------------------------------
  -- Final accept: alice accepts o3 (she is the listing owner = receiver of o3)
  ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_o3);

  ---------------------------------------------------------------------
  -- Status of each link
  ---------------------------------------------------------------------
  select status into v_o1_status from offers where id = v_o1;
  select status into v_o2_status from offers where id = v_o2;
  select status into v_o3_status from offers where id = v_o3;
  if v_o1_status <> 'countered' then raise exception 'o1=%', v_o1_status; end if;
  if v_o2_status <> 'countered' then raise exception 'o2=%', v_o2_status; end if;
  if v_o3_status <> 'accepted'  then raise exception 'o3=%', v_o3_status; end if;

  ---------------------------------------------------------------------
  -- Parent / child chain pointers
  ---------------------------------------------------------------------
  select parent_offer_id into v_o1_parent from offers where id = v_o1;
  select parent_offer_id into v_o2_parent from offers where id = v_o2;
  select parent_offer_id into v_o3_parent from offers where id = v_o3;
  if v_o1_parent is not null then raise exception 'o1.parent should be null, got %', v_o1_parent; end if;
  if v_o2_parent <> v_o1 then raise exception 'o2.parent should be o1, got %', v_o2_parent; end if;
  if v_o3_parent <> v_o2 then raise exception 'o3.parent should be o2, got %', v_o3_parent; end if;

  ---------------------------------------------------------------------
  -- buyer_id preserved across the chain
  ---------------------------------------------------------------------
  select buyer_id into v_o1_buyer from offers where id = v_o1;
  select buyer_id into v_o2_buyer from offers where id = v_o2;
  select buyer_id into v_o3_buyer from offers where id = v_o3;
  if v_o1_buyer <> v_charlie then raise exception 'o1.buyer=%', v_o1_buyer; end if;
  if v_o2_buyer <> v_charlie then raise exception 'o2.buyer=%', v_o2_buyer; end if;
  if v_o3_buyer <> v_charlie then raise exception 'o3.buyer=%', v_o3_buyer; end if;

  ---------------------------------------------------------------------
  -- proposer_id alternates: charlie → alice → charlie
  ---------------------------------------------------------------------
  select proposer_id into v_o1_proposer from offers where id = v_o1;
  select proposer_id into v_o2_proposer from offers where id = v_o2;
  select proposer_id into v_o3_proposer from offers where id = v_o3;
  if v_o1_proposer <> v_charlie then raise exception 'o1.proposer=%', v_o1_proposer; end if;
  if v_o2_proposer <> v_alice   then raise exception 'o2.proposer=%', v_o2_proposer; end if;
  if v_o3_proposer <> v_charlie then raise exception 'o3.proposer=%', v_o3_proposer; end if;

  ---------------------------------------------------------------------
  -- offer_items per link
  ---------------------------------------------------------------------
  select count(*) into v_o1_items from offer_items where offer_id = v_o1;
  select count(*) into v_o2_items from offer_items where offer_id = v_o2;
  select count(*) into v_o3_items from offer_items where offer_id = v_o3;
  if v_o1_items <> 2 then raise exception 'o1 items=%', v_o1_items; end if;
  if v_o2_items <> 3 then raise exception 'o2 items=%', v_o2_items; end if;
  if v_o3_items <> 2 then raise exception 'o3 items=%', v_o3_items; end if;

  -- o3 must contain lens + tripod (not glasses)
  if not exists (select 1 from offer_items where offer_id = v_o3 and listing_id = v_lens)
    then raise exception 'o3 missing lens'; end if;
  if not exists (select 1 from offer_items where offer_id = v_o3 and listing_id = v_tripod)
    then raise exception 'o3 missing tripod'; end if;
  if exists (select 1 from offer_items where offer_id = v_o3 and listing_id = v_glasses)
    then raise exception 'o3 should NOT contain glasses'; end if;

  ---------------------------------------------------------------------
  -- Listing statuses: only the accepted link's items flip to in_trade
  ---------------------------------------------------------------------
  select status into v_camera_status  from listings where id = v_camera;
  select status into v_lens_status    from listings where id = v_lens;
  select status into v_tripod_status  from listings where id = v_tripod;
  select status into v_glasses_status from listings where id = v_glasses;
  if v_camera_status  <> 'in_trade' then raise exception 'camera=%',  v_camera_status; end if;
  if v_lens_status    <> 'in_trade' then raise exception 'lens=%',    v_lens_status; end if;
  if v_tripod_status  <> 'in_trade' then raise exception 'tripod=%',  v_tripod_status; end if;
  if v_glasses_status <> 'active'   then
    raise exception 'glasses should still be active (only in o2, which was countered): %', v_glasses_status;
  end if;

  ---------------------------------------------------------------------
  -- Thread + pinned_offer points to the accepted link (o3)
  ---------------------------------------------------------------------
  select id into v_thread_id from threads
    where listing_id = v_camera
      and buyer_id   = v_charlie
      and seller_id  = v_alice
      and pinned_offer_id = v_o3;
  if v_thread_id is null then
    raise exception 'thread missing or pin not pointing at accepted link o3';
  end if;

  ---------------------------------------------------------------------
  -- Notification fan-out — exact counts by type and per recipient
  -- Expected:
  --   1× trade_offer_received   to alice    (on o1 creation)
  --   1× trade_offer_countered  to charlie  (on o2: alice's counter)
  --   1× trade_offer_countered  to alice    (on o3: charlie's counter)
  --   1× trade_offer_accepted   to charlie  (on accept_offer(o3))
  --   0× trade_offer_auto_passed
  --   = 4 total
  ---------------------------------------------------------------------
  select count(*) into v_total_notif      from notifications;
  if v_total_notif <> 4 then
    raise exception 'total notifications = % (expected 4)', v_total_notif;
  end if;

  select count(*) into v_received_count   from notifications where type = 'trade_offer_received';
  select count(*) into v_countered_count  from notifications where type = 'trade_offer_countered';
  select count(*) into v_accepted_count   from notifications where type = 'trade_offer_accepted';
  select count(*) into v_autopass_count   from notifications where type = 'trade_offer_auto_passed';
  if v_received_count   <> 1 then raise exception 'received=%',   v_received_count; end if;
  if v_countered_count  <> 2 then raise exception 'countered=%',  v_countered_count; end if;
  if v_accepted_count   <> 1 then raise exception 'accepted=%',   v_accepted_count; end if;
  if v_autopass_count   <> 0 then raise exception 'auto_passed=% (expected 0)', v_autopass_count; end if;

  -- Per-recipient breakdown
  select count(*) into v_alice_received   from notifications where user_id = v_alice   and type = 'trade_offer_received';
  select count(*) into v_alice_countered  from notifications where user_id = v_alice   and type = 'trade_offer_countered';
  select count(*) into v_charlie_countered from notifications where user_id = v_charlie and type = 'trade_offer_countered';
  select count(*) into v_charlie_accepted from notifications where user_id = v_charlie and type = 'trade_offer_accepted';
  if v_alice_received    <> 1 then raise exception 'alice received=%',    v_alice_received; end if;
  if v_alice_countered   <> 1 then raise exception 'alice countered=%',   v_alice_countered; end if;
  if v_charlie_countered <> 1 then raise exception 'charlie countered=%', v_charlie_countered; end if;
  if v_charlie_accepted  <> 1 then raise exception 'charlie accepted=%',  v_charlie_accepted; end if;

  raise notice 'PASS: e2e counter chain — 3 links, alternation, parent pointers, exact notifs';
  perform _test_cleanup();
end $$;
