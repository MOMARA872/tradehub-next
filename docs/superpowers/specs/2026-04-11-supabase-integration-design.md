# TradeHub — Supabase Database + Auth Integration Design

**Date:** 2026-04-11
**Approach:** Supabase + Server Components (Approach B)
**Scope:** Database schema, authentication, data flow replacement, image storage, pagination, seed script

## Context

TradeHub is a national marketplace built with Next.js 16, React 19, Tailwind v4. The frontend was recently optimized with SSR (Server Components). Currently uses 18 mock data files — no backend, no database, no auth.

**Goal:** Replace mock data with Supabase (Cloud) for core tables, add real authentication (email + Google OAuth), add image uploads via Supabase Storage, add pagination, and seed existing mock data.

**Supabase project:** `https://lngqskdappjaarxclswf.supabase.co`

**Constraints:**
- Preserve SSR architecture (Server Components fetch data)
- Only migrate core data: categories, profiles, listings, offers
- Reviews, messages, trade chains, notifications stay as mock data for now
- Remove view count from listings entirely

## Section 1: Database Schema

### Tables

**profiles** (extends Supabase `auth.users`)
```sql
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
```

**categories** (static reference data)
```sql
create table categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  description text not null default '',
  is_hot boolean not null default false,
  subcategories text[] not null default '{}'
);
```

**listings**
```sql
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
```

Note: `views_count` is intentionally excluded — removed from the platform.

**offers**
```sql
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
```

### Auto-create profile on signup (Postgres trigger)

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### Row-Level Security (RLS)

**categories:**
- `SELECT`: public (anyone can read)
- No INSERT/UPDATE/DELETE (seed-only, managed by admin)

**profiles:**
- `SELECT`: public (anyone can read)
- `UPDATE`: `auth.uid() = id` (owner only)

**listings:**
- `SELECT`: public (anyone can read)
- `INSERT`: `auth.uid() = user_id` (authenticated, must be own listing)
- `UPDATE`: `auth.uid() = user_id` (owner only)
- `DELETE`: `auth.uid() = user_id` (owner only)

**offers:**
- `SELECT`: `auth.uid() = buyer_id OR auth.uid() IN (SELECT user_id FROM listings WHERE id = listing_id)` (buyer or listing owner)
- `INSERT`: `auth.uid() = buyer_id` (authenticated, must be own offer)
- `UPDATE`: buyer or listing owner can update status

### Indexes

```sql
create index idx_listings_category on listings(category_id);
create index idx_listings_user on listings(user_id);
create index idx_listings_status on listings(status);
create index idx_listings_created on listings(created_at desc);
create index idx_offers_listing on offers(listing_id);
create index idx_offers_buyer on offers(buyer_id);
```

## Section 2: Supabase Client Setup

### Packages

```
@supabase/supabase-js
@supabase/ssr
```

### Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Three Client Instances

**Server client** — `lib/supabase/server.ts`
- Used in Server Components and API routes
- Reads cookies via `cookies()` from `next/headers`
- Pattern: `createServerClient(url, anonKey, { cookies })`

**Browser client** — `lib/supabase/client.ts`
- Used in Client Components for mutations and auth actions
- Singleton pattern: `createBrowserClient(url, anonKey)`

**Middleware client** — `lib/supabase/middleware.ts`
- Refreshes auth tokens on every request
- Updates cookies via `request`/`response` objects

## Section 3: Authentication

### Signup Flow
1. User enters email + password or clicks "Continue with Google"
2. Email/password: `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
3. Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
4. Postgres trigger creates `profiles` row automatically
5. Redirect to homepage

### Login Flow
1. Email/password: `supabase.auth.signInWithPassword({ email, password })`
2. Google OAuth: same as signup (Supabase handles existing accounts)
3. Redirect to previous page or homepage

### Session Management
- Cookies managed by `@supabase/ssr`
- Middleware refreshes tokens on every request
- Server Components: `supabase.auth.getUser()` (secure, hits Supabase)
- Client Components: `supabase.auth.getSession()` (reads from cookie)

### Auth Middleware (`middleware.ts`)
- Runs on every request
- Refreshes session cookies
- Protects routes: `/dashboard`, `/messages`, `/post-new`, `/settings`, `/offers`, `/analytics`, `/reviews`, `/disputes`
- Redirects unauthenticated users to `/login`

### Files Changed
- `app/(auth)/login/page.tsx` — rewrite with real Supabase auth
- `app/(auth)/register/page.tsx` — rewrite with real Supabase auth
- `app/(auth)/layout.tsx` — add auth redirect (if already logged in, go to homepage)
- `components/layout/Navbar.tsx` — replace `useAuthStore` with Supabase session
- `store/authStore.ts` — deleted (replaced by Supabase auth)
- `middleware.ts` — new file at project root

### Google OAuth Setup
Requires configuration in Supabase dashboard:
1. Authentication > Providers > Google
2. Add Google Cloud OAuth client ID and secret
3. Set redirect URL to `https://lngqskdappjaarxclswf.supabase.co/auth/v1/callback`

## Section 4: Data Flow — Replacing Mock Data

### Page-by-Page Changes

**Homepage** (`app/(main)/page.tsx`)
- Before: `import { LISTINGS } from '@/lib/data/listings'`
- After: `const { data: listings } = await supabase.from('listings').select('*, profiles(display_name, avatar_initials, profile_image)').eq('status', 'active').order('created_at', { ascending: false }).limit(8)`
- Featured: `.order('created_at', { ascending: false }).limit(4)` (replace viewsCount filter)

**Browse** (`components/browse/BrowseContent.tsx`)
- Before: `import { LISTINGS }` + client filter
- After: `supabase.from('listings').select('*, profiles(display_name)').eq('category_id', id).range(from, to)`
- Add pagination (page numbers)

**Listing detail** (`app/(main)/listing/[id]/page.tsx`)
- Before: `LISTINGS.find(l => l.id === id)`
- After: `supabase.from('listings').select('*, profiles(*), offers(*, profiles(display_name, avatar_initials))').eq('id', id).single()`

**Search** (`components/search/SearchContent.tsx`)
- Before: Client-side array filter
- After: `supabase.from('listings').select('*').or('title.ilike.%query%,description.ilike.%query%,tags.cs.{query}').range(from, to)`
- Add pagination

**Post new** (`app/(main)/post-new/page.tsx`)
- Before: `addListing()` to Zustand store
- After: `supabase.from('listings').insert(data)` + redirect to listing page
- Photos uploaded to Supabase Storage first, URLs stored in `photos` array

### Files Removed
- `lib/data/listings.ts` — replaced by DB
- `lib/data/users.ts` — replaced by profiles table
- `lib/data/categories.ts` — replaced by DB (seeded)
- `lib/data/offers.ts` — replaced by DB
- `store/listingsStore.ts` — removed (DB is source of truth)
- `store/authStore.ts` — removed (Supabase auth)

### Files Kept as Mock Data
- `lib/data/conditions.ts` — static reference, no DB needed
- `lib/data/regions.ts` — static reference
- `lib/data/reviews.ts` — future sub-project
- `lib/data/community.ts`, `disputes.ts`, `notifications.ts`, `trade-chains.ts`, etc. — future

### Type Updates
- `lib/types/index.ts` — remove `viewsCount` from `Listing` interface
- Update types to match Supabase column names (snake_case from DB, mapped in queries)

## Section 5: Image Storage (Supabase Storage)

### Storage Bucket
- Bucket name: `listing-photos`
- Public bucket (photos are publicly viewable)
- Max file size: 5MB
- Allowed types: `image/jpeg`, `image/png`, `image/webp`

### Upload Flow (post-new page)
1. User selects photos via file input
2. Each photo uploaded to `listing-photos/{user_id}/{uuid}.{ext}`
3. Get public URL via `supabase.storage.from('listing-photos').getPublicUrl(path)`
4. Store URLs in `photos` text[] column on insert

### Storage RLS
- Public read (anyone can view photos)
- Insert: authenticated users, path must start with own user_id
- Delete: authenticated users, path must start with own user_id

## Section 6: Pagination

### Pattern
- URL-based page numbers: `?page=1`, `?page=2`
- 12 listings per page
- Supabase: `.range(from, to)` where `from = (page - 1) * 12`, `to = from + 11`
- Count query: `supabase.from('listings').select('*', { count: 'exact', head: true })`

### Pages with Pagination
- **Browse** (`/browse?category=X&page=1`) — when viewing category listings
- **Search** (`/search?q=X&page=1`) — search results

### Pagination Component
- New component: `components/common/Pagination.tsx`
- Shows: Previous / 1 2 3 ... N / Next
- Server-rendered (no client state needed — reads from URL params)

## Section 7: Seed Script

### File: `scripts/seed.ts`
- Run via: `npx tsx scripts/seed.ts`
- Uses `SUPABASE_SERVICE_ROLE_KEY` (admin access, bypasses RLS)

### Seed Order
1. **Categories** — upsert from mock `lib/data/categories.ts`
2. **Auth users** — create via `supabase.auth.admin.createUser()` for each mock user
3. **Profiles** — update profile rows with mock data (bio, rating, city, etc.)
4. **Listings** — insert from mock data, mapping old user IDs to new auth user IDs
5. **Offers** — insert from mock data, mapping IDs

### ID Mapping
Mock data uses string IDs like `"user1"`, `"listing1"`. Supabase uses UUIDs. The seed script maintains a mapping:
```
mockUserId -> supabaseUUID
mockListingId -> supabaseUUID
```

## Out of Scope

- Reviews system (future sub-project)
- Messaging/real-time (future sub-project)
- Trade chains (future sub-project)
- Notifications (future sub-project)
- Caching layer / Redis (future)
- Monitoring / error tracking (future)
- Email verification flow (Supabase handles basic email, custom templates later)
- Admin panel / moderation tools
