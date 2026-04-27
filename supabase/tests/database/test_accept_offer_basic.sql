\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid; v_helmet uuid;
  v_offer uuid;
  v_thread_id uuid;
  v_status text;
  v_listing_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_helmet := _test_create_listing(v_bob, 'Helmet');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike, v_helmet], '');

  -- Ownership guard: Bob (non-owner) cannot accept while still pending.
  -- Strict like-match, no OR — this isolates the ownership guard.
  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: non-owner accept allowed';
  exception when others then
    if sqlerrm not like '%listing owner%' then
      raise exception 'wrong error (expected ownership guard, got): %', sqlerrm;
    end if;
  end;

  -- Sanity: offer should still be pending after the failed accept attempt.
  select status into v_status from offers where id = v_offer;
  if v_status <> 'pending' then
    raise exception 'offer should still be pending, got %', v_status;
  end if;

  -- Happy path: Alice accepts
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);

  -- Offer status flipped to accepted
  select status into v_status from offers where id = v_offer;
  if v_status <> 'accepted' then raise exception 'offer status=%', v_status; end if;

  -- Listings flipped to in_trade
  select status into v_listing_status from listings where id = v_camera;
  if v_listing_status <> 'in_trade' then raise exception 'camera=%', v_listing_status; end if;
  select status into v_listing_status from listings where id = v_bike;
  if v_listing_status <> 'in_trade' then raise exception 'bike=%', v_listing_status; end if;
  select status into v_listing_status from listings where id = v_helmet;
  if v_listing_status <> 'in_trade' then raise exception 'helmet=%', v_listing_status; end if;

  -- Thread exists with pin and correct fields
  select id into v_thread_id from threads
    where listing_id = v_camera and buyer_id = v_bob and seller_id = v_alice
      and pinned_offer_id = v_offer;
  if v_thread_id is null then raise exception 'thread/pin missing'; end if;

  -- Notification fired to buyer
  if not exists (
    select 1 from notifications
    where user_id = v_bob and type = 'trade_offer_accepted'
  ) then raise exception 'accept notification missing'; end if;

  -- Not-pending guard: double-accept on already-accepted offer must fail.
  -- Strict like-match isolates the not-pending guard from the ownership guard.
  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: double-accept allowed';
  exception when others then
    if sqlerrm not like '%not pending%' then
      raise exception 'wrong error (expected not-pending guard, got): %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: accept_offer basic';
  perform _test_cleanup();
end $$;
