\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid;
  v_bike uuid; v_lens uuid;
  v_offer_bob uuid; v_offer_charlie uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_lens   := _test_create_listing(v_charlie, 'Lens');

  -- Two offers on the same listing
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_bob := create_trade_offer(v_camera, array[v_bike], '');
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_offer_charlie := create_trade_offer(v_camera, array[v_lens], '');

  -- Alice accepts Bob's
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer_bob);

  -- Charlie's should be auto_passed_listing
  select status into v_status from offers where id = v_offer_charlie;
  if v_status <> 'auto_passed_listing' then
    raise exception 'expected auto_passed_listing, got %', v_status;
  end if;

  -- Charlie should have a notification
  if not exists (
    select 1 from notifications
    where user_id = v_charlie and type = 'trade_offer_auto_passed'
  ) then raise exception 'auto-pass notification missing'; end if;

  raise notice 'PASS: accept_offer listing-wide auto-pass';
  perform _test_cleanup();
end $$;
