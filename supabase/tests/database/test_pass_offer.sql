\i supabase/tests/database/_helpers.sql
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

  -- Bob creates offer
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Alice passes
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform pass_offer(v_offer);

  select status into v_status from offers where id = v_offer;
  if v_status <> 'passed' then raise exception 'status=%', v_status; end if;

  if not exists (
    select 1 from notifications where user_id = v_bob and type = 'trade_offer_passed'
  ) then raise exception 'notification missing'; end if;

  -- Bob (non-owner) cannot pass
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  begin
    perform pass_offer(v_offer);
    raise exception 'TEST FAILED: non-owner pass was allowed';
  exception when others then
    if sqlerrm not like '%listing owner%' and sqlerrm not like '%not pending%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: pass_offer';
  perform _test_cleanup();
end $$;
