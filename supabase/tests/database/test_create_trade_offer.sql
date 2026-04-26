-- supabase/tests/database/test_create_trade_offer.sql
\i supabase/tests/database/_helpers.sql

do $$
declare
  v_alice uuid;
  v_bob   uuid;
  v_camera uuid;
  v_bike   uuid;
  v_helmet uuid;
  v_offer  uuid;
  v_count  int;
begin
  perform _test_cleanup();

  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_helmet := _test_create_listing(v_bob, 'Helmet');

  -- Simulate Bob calling the function
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike, v_helmet], 'fair trade?');

  -- Verify
  select count(*) into v_count from offers
    where id = v_offer and status = 'pending' and offer_type = 'trade'
      and buyer_id = v_bob and proposer_id = v_bob and listing_id = v_camera;
  if v_count <> 1 then raise exception 'offer row wrong'; end if;

  select count(*) into v_count from offer_items where offer_id = v_offer;
  if v_count <> 2 then raise exception 'item count wrong: %', v_count; end if;

  select count(*) into v_count from notifications
    where user_id = v_alice and type = 'trade_offer_received';
  if v_count <> 1 then raise exception 'notification missing'; end if;

  -- Self-offer must fail
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  begin
    perform create_trade_offer(v_camera, array[v_bike], '');
    raise exception 'TEST FAILED: self-offer was allowed';
  exception when others then
    if sqlerrm not like '%own listing%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  -- 6 items must fail
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  begin
    perform create_trade_offer(v_camera,
      array[v_bike, v_helmet, v_bike, v_helmet, v_bike, v_helmet], '');
    raise exception 'TEST FAILED: 6 items was allowed';
  exception when others then
    if sqlerrm not like '%more than 5%' and sqlerrm not like '%5 items%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: create_trade_offer';
  perform _test_cleanup();
end $$;
