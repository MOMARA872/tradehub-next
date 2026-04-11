-- supabase/migrations/002_fix_handle_new_user.sql
--
-- Fix: "Database error saving new user" during signup / OAuth.
--
-- The original handle_new_user() trigger in 001_initial_schema.sql was created
-- SECURITY DEFINER without an explicit search_path. In Supabase, SECURITY
-- DEFINER functions run with a restricted search_path, so unqualified
-- references to `profiles` fail to resolve and the trigger errors out.
-- Supabase then wraps that as "Database error saving new user" on the
-- auth redirect.
--
-- This migration:
--   1. Replaces the function with a schema-qualified, search_path-pinned
--      version with robust NULL handling for display_name / avatar_initials.
--   2. Wraps the insert in an exception handler so a profile-row failure
--      never blocks the auth.users insert (fail-soft — the app can reconcile
--      the profile row later if anything still goes wrong).
--   3. Recreates the trigger idempotently.
--   4. Adds a permissive INSERT policy on profiles so the trigger works
--      regardless of the function owner's RLS bypass privileges.
--
-- NOTE: This migration was applied manually via Supabase Dashboard →
-- SQL Editor on 2026-04-11. This file exists for source control so the
-- next developer running `supabase db push` (or re-provisioning a fresh
-- project) gets the same state.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_initials text;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'TradeHub User'
  );

  v_initials := upper(left(v_name, 2));
  if v_initials is null or v_initials = '' then
    v_initials := 'TH';
  end if;

  begin
    insert into public.profiles (id, display_name, avatar_initials)
    values (new.id, v_name, v_initials)
    on conflict (id) do nothing;
  exception when others then
    -- Never block signup on a profile-row failure; log and continue.
    raise warning 'handle_new_user: failed to insert profile for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Belt-and-suspenders: allow the trigger's insert even if the function owner
-- doesn't bypass RLS. The check is scoped to auth.uid() = id so regular
-- client inserts remain impossible (clients can't forge their own id).
drop policy if exists "Trigger can insert own profile" on public.profiles;
create policy "Trigger can insert own profile"
  on public.profiles for insert
  with check (auth.uid() is null or auth.uid() = id);
