\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_dave uuid; v_bob uuid;
  v_camera uuid; v_phone uuid;
  v_bike uuid;
  v_offer_to_alice uuid; v_offer_to_dave uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_dave  := _test_create_user('dave');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_phone  := _test_create_listing(v_dave, 'Phone');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  -- Bob offers his bike to BOTH Alice and Dave
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_to_alice := create_trade_offer(v_camera, array[v_bike], '');
  v_offer_to_dave  := create_trade_offer(v_phone,  array[v_bike], '');

  -- Alice accepts
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer_to_alice);

  -- The Dave-side offer should be auto_passed_item_taken
  select status into v_status from offers where id = v_offer_to_dave;
  if v_status <> 'auto_passed_item_taken' then
    raise exception 'expected auto_passed_item_taken, got %', v_status;
  end if;

  -- Bob should have an item-taken notification
  if not exists (
    select 1 from notifications
    where user_id = v_bob
      and type = 'trade_offer_auto_passed'
      and title = 'Item already traded'
  ) then raise exception 'item-taken notification missing'; end if;

  raise notice 'PASS: accept_offer item-overlap auto-pass';
  perform _test_cleanup();
end $$;
