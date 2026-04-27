\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
  v_status text;
  v_listing_status text;
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

  -- Only buyer marks first
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform mark_offer_complete(v_offer);
  select status into v_status from offers where id = v_offer;
  if v_status <> 'accepted' then raise exception 'should still be accepted: %', v_status; end if;

  -- Now seller — flips to completed
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform mark_offer_complete(v_offer);
  select status into v_status from offers where id = v_offer;
  if v_status <> 'completed' then raise exception 'expected completed: %', v_status; end if;

  -- Listings should be sold
  select status into v_listing_status from listings where id = v_camera;
  if v_listing_status <> 'sold' then raise exception 'camera=%', v_listing_status; end if;
  select status into v_listing_status from listings where id = v_bike;
  if v_listing_status <> 'sold' then raise exception 'bike=%', v_listing_status; end if;

  -- Both should have completed notifications
  if (select count(*) from notifications where type = 'trade_offer_completed') <> 2 then
    raise exception 'completed notifications missing';
  end if;

  raise notice 'PASS: mark_offer_complete';
  perform _test_cleanup();
end $$;
