\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
  v_offer_pending uuid;  -- second offer kept pending to isolate ownership-guard test
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  -- Bob creates offer #1 (will be passed by Alice)
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Alice passes #1
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform pass_offer(v_offer);

  select status into v_status from offers where id = v_offer;
  if v_status <> 'passed' then raise exception 'status=%', v_status; end if;

  if not exists (
    select 1 from notifications where user_id = v_bob and type = 'trade_offer_passed'
  ) then raise exception 'notification missing'; end if;

  -- Bob creates offer #2 (will stay pending) so we can test the ownership
  -- guard independently of the not-pending status guard.
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_pending := create_trade_offer(v_camera, array[v_bike], 'second pending');

  -- Ownership guard: Bob (non-owner) cannot pass a still-pending offer.
  begin
    perform pass_offer(v_offer_pending);
    raise exception 'TEST FAILED: non-owner pass was allowed on pending offer';
  exception when others then
    -- Strict: must be the ownership error, not the not-pending error.
    if sqlerrm not like '%listing owner%' then
      raise exception 'wrong error (expected ownership guard, got): %', sqlerrm;
    end if;
  end;

  -- Sanity: offer #2 should still be pending after the failed pass attempt.
  select status into v_status from offers where id = v_offer_pending;
  if v_status <> 'pending' then
    raise exception 'offer #2 should still be pending, got %', v_status;
  end if;

  -- Not-pending guard: have Alice pass #2, then a second pass must
  -- hit the status guard (separate from the ownership guard above).
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform pass_offer(v_offer_pending);
  begin
    perform pass_offer(v_offer_pending);
    raise exception 'TEST FAILED: double-pass was allowed';
  exception when others then
    if sqlerrm not like '%not pending%' then
      raise exception 'wrong error (expected not-pending guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: pass_offer';
  perform _test_cleanup();
end $$;
