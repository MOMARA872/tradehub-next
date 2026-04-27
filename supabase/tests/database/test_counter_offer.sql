\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid; v_bike uuid; v_helmet uuid; v_lock uuid;
  v_charlie_skate uuid;
  v_offer1 uuid; v_offer2 uuid; v_offer3 uuid;
  v_status text;
  v_count int;
begin
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_bob     := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera         := _test_create_listing(v_alice,   'Camera');
  v_bike           := _test_create_listing(v_bob,     'Bike');
  v_helmet         := _test_create_listing(v_bob,     'Helmet');
  v_lock           := _test_create_listing(v_bob,     'Lock');
  v_charlie_skate  := _test_create_listing(v_charlie, 'Skateboard');

  -- Bob's original offer: bike + helmet
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer1 := create_trade_offer(v_camera, array[v_bike, v_helmet], '');

  -- Happy path: Alice counters with bike + helmet + lock
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  v_offer2 := counter_offer(v_offer1, array[v_bike, v_helmet, v_lock], 'add lock');

  -- Parent should be 'countered'
  select status into v_status from offers where id = v_offer1;
  if v_status <> 'countered' then raise exception 'parent status=%', v_status; end if;

  -- Child fields
  if not exists (
    select 1 from offers
    where id = v_offer2 and proposer_id = v_alice and buyer_id = v_bob
      and parent_offer_id = v_offer1 and listing_id = v_camera
      and status = 'pending'
  ) then raise exception 'child fields wrong'; end if;

  -- Items belong to Bob (the buyer side)
  select count(*) into v_count
    from offer_items oi join listings l on l.id = oi.listing_id
    where oi.offer_id = v_offer2 and l.user_id = v_bob;
  if v_count <> 3 then raise exception 'item ownership wrong: %', v_count; end if;

  -- Notification fired to Bob (the original proposer)
  if not exists (
    select 1 from notifications where user_id = v_bob and type = 'trade_offer_countered'
  ) then raise exception 'counter notification missing'; end if;

  -- Bob counters back: just bike (drop helmet + lock)
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform counter_offer(v_offer2, array[v_bike], 'final');

  select status into v_status from offers where id = v_offer2;
  if v_status <> 'countered' then raise exception 'v_offer2 status=%', v_status; end if;

  -- ============================================================
  -- Isolated rejection-path tests: each one uses a NEW pending offer
  -- so the guard under test is the only one that fires.
  -- ============================================================

  -- Set up a fresh pending offer (offer3) for the rejection tests
  -- (offer1 is countered, offer2 is countered; we need a fresh one).
  -- First wipe and rebuild fixtures for cleaner ownership semantics.
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_bob     := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera         := _test_create_listing(v_alice,   'Camera');
  v_bike           := _test_create_listing(v_bob,     'Bike');
  v_helmet         := _test_create_listing(v_bob,     'Helmet');
  v_charlie_skate  := _test_create_listing(v_charlie, 'Skateboard');
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer3 := create_trade_offer(v_camera, array[v_bike], '');

  -- Receiver guard: Bob (the proposer of offer3) cannot counter his own offer.
  -- Receiver of offer3 is Alice. Bob is the proposer, NOT the receiver.
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  begin
    perform counter_offer(v_offer3, array[v_bike], 'self-counter');
    raise exception 'TEST FAILED: proposer was allowed to counter own offer';
  exception when others then
    if sqlerrm not like '%receiver%' then
      raise exception 'wrong error (expected receiver guard, got): %', sqlerrm;
    end if;
  end;

  -- Charlie (uninvolved) cannot counter — also not the receiver.
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  begin
    perform counter_offer(v_offer3, array[v_bike], 'meddler');
    raise exception 'TEST FAILED: uninvolved user was allowed to counter';
  exception when others then
    if sqlerrm not like '%receiver%' then
      raise exception 'wrong error (expected receiver guard, got): %', sqlerrm;
    end if;
  end;

  -- Items-not-owned-by-buyer guard: Alice (receiver) tries to counter with
  -- Charlie's skateboard (which doesn't belong to Bob, the buyer).
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  begin
    perform counter_offer(v_offer3, array[v_charlie_skate], 'wrong owner');
    raise exception 'TEST FAILED: items not owned by buyer were allowed';
  exception when others then
    if sqlerrm not like '%not active or not owned by the buyer%' then
      raise exception 'wrong error (expected ownership guard, got): %', sqlerrm;
    end if;
  end;

  -- Duplicate items guard
  begin
    perform counter_offer(v_offer3, array[v_bike, v_bike], 'dupes');
    raise exception 'TEST FAILED: duplicate items were allowed';
  exception when others then
    if sqlerrm not like '%uplicate items%' then
      raise exception 'wrong error (expected duplicate guard, got): %', sqlerrm;
    end if;
  end;

  -- Empty array guard
  begin
    perform counter_offer(v_offer3, array[]::uuid[], 'empty');
    raise exception 'TEST FAILED: empty array was allowed';
  exception when others then
    if sqlerrm not like '%at least 1 item%' then
      raise exception 'wrong error (expected min-count guard, got): %', sqlerrm;
    end if;
  end;

  -- 6-items guard (use bike+helmet repeated to reach 6 entries; cap fires on length first)
  begin
    perform counter_offer(v_offer3,
      array[v_bike, v_helmet, v_bike, v_helmet, v_bike, v_helmet], '6items');
    raise exception 'TEST FAILED: 6 items were allowed';
  exception when others then
    if sqlerrm not like '%more than 5%' and sqlerrm not like '%5 items%' then
      raise exception 'wrong error (expected max-count guard, got): %', sqlerrm;
    end if;
  end;

  -- Sanity: offer3 should still be pending after all rejected attempts
  select status into v_status from offers where id = v_offer3;
  if v_status <> 'pending' then
    raise exception 'offer3 should still be pending, got %', v_status;
  end if;

  -- Status guard: Alice passes offer3, then anyone tries to counter — must fail.
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform pass_offer(v_offer3);
  begin
    perform counter_offer(v_offer3, array[v_bike], 'too late');
    raise exception 'TEST FAILED: counter on passed offer was allowed';
  exception when others then
    if sqlerrm not like '%not pending%' then
      raise exception 'wrong error (expected status guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: counter_offer';
  perform _test_cleanup();
end $$;
