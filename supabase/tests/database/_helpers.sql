-- supabase/tests/database/_helpers.sql
-- Shared fixtures. Source this at the top of each test with \i

-- Create a test user (auth.users + profiles row)
create or replace function _test_create_user(p_name text) returns uuid as $$
declare
  v_id uuid := gen_random_uuid();
begin
  -- Insert directly; bypasses handle_new_user trigger
  insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at,
                          aud, role, instance_id)
  values (v_id, p_name || '@test.local', jsonb_build_object('full_name', p_name),
          now(), now(), 'authenticated', 'authenticated',
          '00000000-0000-0000-0000-000000000000');
  -- The auth.users trigger will create the profile.
  return v_id;
end $$ language plpgsql;

-- Create a test category if it doesn't exist
create or replace function _test_ensure_category() returns text as $$
begin
  insert into categories (id, name, slug, icon)
  values ('test-cat', 'Test Category', 'test-cat', '📦')
  on conflict (id) do nothing;
  return 'test-cat';
end $$ language plpgsql;

-- Create a test listing
create or replace function _test_create_listing(
  p_user uuid, p_title text
) returns uuid as $$
declare
  v_id uuid := gen_random_uuid();
begin
  perform _test_ensure_category();
  insert into listings (id, user_id, category_id, title, price, price_type)
  values (v_id, p_user, 'test-cat', p_title, 0, 'trade');
  return v_id;
end $$ language plpgsql;

-- Reset all rows we create (call at end of each test for hygiene)
create or replace function _test_cleanup() returns void as $$
begin
  delete from offer_items;
  delete from offers;
  delete from threads;
  delete from notifications;
  delete from listings;
  delete from auth.users where email like '%@test.local';
end $$ language plpgsql;
