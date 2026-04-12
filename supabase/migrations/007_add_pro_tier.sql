-- supabase/migrations/007_add_pro_tier.sql
-- Add pro tier support: Stripe billing columns, RLS gating for fixed-price listings, and 'paused' status

-- ============================================================
-- 1. ADD PRO TIER COLUMNS TO profiles
-- ============================================================

alter table public.profiles
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'pro')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  add column if not exists trial_ends_at timestamptz;

-- ============================================================
-- 2. INDEX ON stripe_customer_id FOR WEBHOOK LOOKUPS
-- ============================================================

create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id);

-- ============================================================
-- 3. REPLACE INSERT POLICY ON listings — gate fixed-price on pro tier
-- ============================================================

drop policy if exists "Authenticated users can create listings" on public.listings;

create policy "Authenticated users can create listings"
  on public.listings for insert
  with check (
    auth.uid() = user_id
    and (
      price_type != 'fixed'
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
          and tier = 'pro'
          and subscription_status in ('trialing', 'active')
      )
    )
  );

-- ============================================================
-- 4. REPLACE UPDATE POLICY ON listings — same tier check on WITH CHECK
-- ============================================================

drop policy if exists "Users can update own listings" on public.listings;

create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      price_type != 'fixed'
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
          and tier = 'pro'
          and subscription_status in ('trialing', 'active')
      )
    )
  );

-- ============================================================
-- 5. ADD 'paused' TO listings status CHECK CONSTRAINT
-- ============================================================

alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
    check (status in ('active', 'sold', 'expired', 'paused'));
