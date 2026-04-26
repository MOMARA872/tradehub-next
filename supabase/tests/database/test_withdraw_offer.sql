\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Charlie cannot withdraw (not the proposer)
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  begin
    perform withdraw_offer(v_offer);
    raise exception 'TEST FAILED: non-proposer withdraw allowed';
  exception when others then
    if sqlerrm not like '%proposer%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  -- Bob can
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform withdraw_offer(v_offer);
  select status into v_status from offers where id = v_offer;
  if v_status <> 'withdrawn' then raise exception 'status=%', v_status; end if;

  -- Cannot withdraw again (no longer pending)
  begin
    perform withdraw_offer(v_offer);
    raise exception 'TEST FAILED: double withdraw allowed';
  exception when others then
    if sqlerrm not like '%not pending%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: withdraw_offer';
  perform _test_cleanup();
end $$;
