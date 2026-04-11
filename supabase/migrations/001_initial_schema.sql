-- supabase/migrations/001_initial_schema.sql

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_initials text not null default '',
  profile_image text,
  city text not null default '',
  bio text not null default '',
  is_verified boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  review_count integer not null default 0,
  trust_score integer not null default 50,
  response_rate integer not null default 0,
  listing_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  description text not null default '',
  is_hot boolean not null default false,
  subcategories text[] not null default '{}'
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category_id text not null references categories(id),
  subcategory text not null default '',
  title text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  price_type text not null default 'fixed' check (price_type in ('fixed', 'free', 'trade', 'negotiable')),
  condition text not null default 'good' check (condition in ('new', 'likenew', 'good', 'used', 'old')),
  condition_notes text not null default '',
  city text not null default '',
  photos text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'sold', 'expired')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  offer_amount numeric(10,2) not null default 0,
  trade_description text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'countered', 'declined')),
  message text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_listings_category on listings(category_id);
create index idx_listings_user on listings(user_id);
create index idx_listings_status on listings(status);
create index idx_listings_created on listings(created_at desc);
create index idx_offers_listing on offers(listing_id);
create index idx_offers_buyer on offers(buyer_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table listings enable row level security;
alter table offers enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Categories are publicly readable"
  on categories for select using (true);

create policy "Listings are publicly readable"
  on listings for select using (true);

create policy "Authenticated users can create listings"
  on listings for insert with check (auth.uid() = user_id);

create policy "Users can update own listings"
  on listings for update using (auth.uid() = user_id);

create policy "Users can delete own listings"
  on listings for delete using (auth.uid() = user_id);

create policy "Offer participants can read offers"
  on offers for select using (
    auth.uid() = buyer_id
    or auth.uid() in (select user_id from listings where id = listing_id)
  );

create policy "Authenticated users can create offers"
  on offers for insert with check (auth.uid() = buyer_id);

create policy "Offer participants can update offers"
  on offers for update using (
    auth.uid() = buyer_id
    or auth.uid() in (select user_id from listings where id = listing_id)
  );

-- ============================================================
-- STORAGE: listing-photos bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "Authenticated users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
