# Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TradeHub's mock data with Supabase (database, auth, storage) while preserving the SSR architecture.

**Architecture:** Server Components fetch data from Supabase via server client (cookie-based auth). Client Components use browser client for mutations (create listing, make offer, auth actions). Middleware refreshes auth tokens and protects routes. Supabase Storage handles listing photo uploads.

**Tech Stack:** Next.js 16, React 19, Supabase (Cloud), @supabase/ssr, @supabase/supabase-js, TypeScript

---

## File Structure

### New files
- `lib/supabase/server.ts` — Server-side Supabase client (Server Components, route handlers)
- `lib/supabase/client.ts` — Browser-side Supabase client (Client Components)
- `lib/supabase/middleware.ts` — Middleware helper for auth token refresh
- `lib/supabase/types.ts` — Generated Supabase database types
- `middleware.ts` — Next.js middleware for auth + token refresh
- `app/(auth)/callback/route.ts` — OAuth callback route handler
- `components/auth/LoginForm.tsx` — Login form with email + Google
- `components/auth/RegisterForm.tsx` — Register form with email + Google
- `components/common/Pagination.tsx` — Page number pagination component
- `components/listing/PhotoUpload.tsx` — Photo upload client component
- `scripts/seed.ts` — Database seed script
- `supabase/migrations/001_initial_schema.sql` — SQL migration file
- `.env.local` — Environment variables (gitignored)

### Modified files
- `package.json` — Add @supabase/supabase-js, @supabase/ssr
- `app/(auth)/login/page.tsx` — Use real Supabase auth
- `app/(auth)/register/page.tsx` — Use real Supabase auth
- `app/(auth)/layout.tsx` — Redirect if already authenticated
- `app/(main)/page.tsx` — Fetch from Supabase instead of mock data
- `app/(main)/browse/page.tsx` — Fetch from Supabase
- `components/browse/BrowseContent.tsx` — Supabase queries + pagination
- `app/(main)/listing/[id]/page.tsx` — Fetch from Supabase
- `app/(main)/search/page.tsx` — Supabase search queries
- `components/search/SearchContent.tsx` — Supabase queries + pagination
- `app/(main)/post-new/page.tsx` — Real DB insert + photo upload
- `components/layout/Navbar.tsx` — Supabase auth session
- `components/listing/OfferButton.tsx` — Real DB insert for offers
- `lib/types/index.ts` — Remove viewsCount, add Database types

### Deleted files
- `lib/data/listings.ts`
- `lib/data/users.ts`
- `lib/data/categories.ts`
- `lib/data/offers.ts`
- `store/listingsStore.ts`
- `store/authStore.ts`

---

## Task 1: Install Dependencies and Environment Setup

**Files:**
- Modify: `package.json`
- Create: `.env.local`

- [ ] **Step 1: Install Supabase packages**

```bash
cd /Users/jintanakhomwong/Documents/GitHub/tradehub-next
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create .env.local**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
EOF
```

- [ ] **Step 3: Verify .env.local is gitignored**

```bash
grep ".env.local" .gitignore
```

Expected: `.env*.local` or `.env.local` is listed

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @supabase/supabase-js and @supabase/ssr"
```

---

## Task 2: Create Supabase Client Utilities

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/middleware.ts`

- [ ] **Step 1: Create server client**

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Create browser client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create middleware helper**

```ts
// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/messages",
  "/post-new",
  "/settings",
  "/offers",
  "/analytics",
  "/reviews",
  "/disputes",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and visiting auth pages, redirect to home
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/
git commit -m "feat: create Supabase server, browser, and middleware client utilities"
```

---

## Task 3: Create Next.js Middleware

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Create middleware**

```ts
// middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add Next.js middleware for Supabase auth session refresh and route protection"
```

---

## Task 4: Create OAuth Callback Route

**Files:**
- Create: `app/(auth)/callback/route.ts`

- [ ] **Step 1: Create the callback route handler**

```ts
// app/(auth)/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/callback/route.ts
git commit -m "feat: add OAuth callback route handler for code exchange"
```

---

## Task 5: Create Database Schema (SQL Migration)

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/001_initial_schema.sql

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
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

-- Categories (static reference)
create table categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  description text not null default '',
  is_hot boolean not null default false,
  subcategories text[] not null default '{}'
);

-- Listings
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

-- Offers
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

-- Profiles: public read, owner update
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Categories: public read only
create policy "Categories are publicly readable"
  on categories for select using (true);

-- Listings: public read, authenticated insert, owner update/delete
create policy "Listings are publicly readable"
  on listings for select using (true);

create policy "Authenticated users can create listings"
  on listings for insert with check (auth.uid() = user_id);

create policy "Users can update own listings"
  on listings for update using (auth.uid() = user_id);

create policy "Users can delete own listings"
  on listings for delete using (auth.uid() = user_id);

-- Offers: buyer or listing owner can read, authenticated insert, buyer or owner update
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
```

- [ ] **Step 2: Run the migration on Supabase**

Go to Supabase Dashboard > SQL Editor, paste the entire contents of `supabase/migrations/001_initial_schema.sql`, and click "Run".

Alternatively, if Supabase CLI is installed:
```bash
npx supabase db push
```

- [ ] **Step 3: Verify tables exist**

In Supabase Dashboard > Table Editor, confirm these tables exist: `profiles`, `categories`, `listings`, `offers`.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema with RLS policies and storage bucket"
```

---

## Task 6: Update TypeScript Types

**Files:**
- Modify: `lib/types/index.ts`

- [ ] **Step 1: Remove viewsCount from Listing and update types for Supabase**

In `lib/types/index.ts`, remove the `viewsCount` field from the `Listing` interface. Also add a `Database` type alias that can be used with Supabase client.

Remove this line from the `Listing` interface:
```
  viewsCount: number;
```

Also add at the bottom of the file:

```ts
// Supabase row types (matches database columns)
export interface DbProfile {
  id: string;
  display_name: string;
  avatar_initials: string;
  profile_image: string | null;
  city: string;
  bio: string;
  is_verified: boolean;
  rating_avg: number;
  review_count: number;
  trust_score: number;
  response_rate: number;
  listing_count: number;
  created_at: string;
}

export interface DbListing {
  id: string;
  user_id: string;
  category_id: string;
  subcategory: string;
  title: string;
  description: string;
  price: number;
  price_type: PriceType;
  condition: ConditionKey;
  condition_notes: string;
  city: string;
  photos: string[];
  status: 'active' | 'sold' | 'expired';
  tags: string[];
  created_at: string;
}

export interface DbOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  trade_description: string | null;
  status: OfferStatus;
  message: string;
  created_at: string;
}

// Helper to convert DB row to frontend type
export function dbProfileToUser(p: DbProfile): User {
  return {
    id: p.id,
    displayName: p.display_name,
    avatarInitials: p.avatar_initials,
    profileImage: p.profile_image ?? undefined,
    city: p.city,
    bio: p.bio,
    isVerified: p.is_verified,
    ratingAvg: p.rating_avg,
    reviewCount: p.review_count,
    trustScore: p.trust_score,
    joinedAt: p.created_at,
    responseRate: p.response_rate,
    listingCount: p.listing_count,
  };
}

export function dbListingToListing(l: DbListing): Listing {
  return {
    id: l.id,
    userId: l.user_id,
    categoryId: l.category_id,
    subcategory: l.subcategory,
    title: l.title,
    description: l.description,
    price: l.price,
    priceType: l.price_type,
    condition: l.condition,
    conditionNotes: l.condition_notes,
    city: l.city,
    photos: l.photos,
    status: l.status,
    createdAt: l.created_at,
    tags: l.tags,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types/index.ts
git commit -m "feat: add Supabase DB types and conversion helpers, remove viewsCount"
```

---

## Task 7: Create Auth UI Components

**Files:**
- Create: `components/auth/LoginForm.tsx`
- Create: `components/auth/RegisterForm.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`
- Modify: `app/(auth)/layout.tsx`

- [ ] **Step 1: Create LoginForm client component**

```tsx
// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-2 text-center">
        Welcome Back
      </h1>
      <p className="text-sm text-muted text-center mb-6">
        Sign in to your TradeHub account
      </p>

      {error && (
        <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors mb-4"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-subtle">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Your password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-xs text-muted text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand hover:opacity-80">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create RegisterForm client component**

```tsx
// components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-2 text-center">
        Create Account
      </h1>
      <p className="text-sm text-muted text-center mb-6">
        Join TradeHub and start trading
      </p>

      {error && (
        <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-2 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors mb-4"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-subtle">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleRegister} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="At least 6 characters"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-xs text-muted text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:opacity-80">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite login page**

```tsx
// app/(auth)/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 4: Rewrite register page**

```tsx
// app/(auth)/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 5: Update auth layout to check session**

Read the current `app/(auth)/layout.tsx` first, then rewrite it. The layout should center the form vertically and show the TradeHub logo:

```tsx
// app/(auth)/layout.tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-1.5 mb-8">
        <span className="text-2xl">🔄</span>
        <span className="font-heading font-extrabold text-2xl text-foreground">TradeHub</span>
      </Link>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/auth/ app/\(auth\)/
git commit -m "feat: add real Supabase auth login and register pages with Google OAuth"
```

---

## Task 8: Update Navbar with Supabase Auth

**Files:**
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Rewrite Navbar to use Supabase auth**

The Navbar is currently a `"use client"` component that uses `useAuthStore`. Replace it with Supabase auth. Key changes:

1. Replace `useAuthStore` with Supabase browser client
2. Add `onAuthStateChange` listener to track session
3. Replace `logout()` with `supabase.auth.signOut()`
4. Replace `currentUser` lookup from `USERS` array with profile from Supabase
5. Remove the `init()` useEffect

Read the current Navbar first, then make these specific changes:

- Remove: `import { useAuthStore } from "@/store/authStore"`
- Remove: `import { USERS } from "@/lib/data/users"` (if present)
- Add: `import { createClient } from "@/lib/supabase/client"`
- Replace the auth state destructuring with:
```tsx
const supabase = createClient();
const [user, setUser] = useState<any>(null);
const [profile, setProfile] = useState<any>(null);

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setUser(user);
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data));
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

- Replace `isLoggedIn` with `!!user`
- Replace `currentUser` references with `profile` (using snake_case fields: `profile?.display_name`, `profile?.city`)
- Replace `logout()` with:
```tsx
async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/');
  router.refresh();
}
```

- Remove the `init()` useEffect

- [ ] **Step 2: Verify Navbar renders**

Run dev server, open http://localhost:3000, check Navbar shows login/signup buttons when logged out.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: replace authStore with Supabase auth in Navbar"
```

---

## Task 9: Create Pagination Component

**Files:**
- Create: `components/common/Pagination.tsx`

- [ ] **Step 1: Create pagination component**

```tsx
// components/common/Pagination.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  // Show max 5 page numbers with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg hover:bg-surface2 transition-colors"
        >
          Previous
        </Link>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-xs text-subtle">...</span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg border transition-colors",
              page === currentPage
                ? "bg-brand text-white border-brand font-semibold"
                : "text-muted hover:text-foreground border-border hover:bg-surface2"
            )}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg hover:bg-surface2 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/common/Pagination.tsx
git commit -m "feat: add Pagination component with page numbers"
```

---

## Task 10: Create Photo Upload Component

**Files:**
- Create: `components/listing/PhotoUpload.tsx`

- [ ] **Step 1: Create photo upload client component**

```tsx
// components/listing/PhotoUpload.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { X, Upload } from "lucide-react";

interface PhotoUploadProps {
  userId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ userId, photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setUploading(true);

    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo must be under 5MB");
        continue;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, and WebP files are allowed");
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(path);

      newPhotos.push(publicUrl);
    }

    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos].slice(0, maxPhotos);
      onPhotosChange(updated);
    }

    setUploading(false);
    // Reset input
    e.target.value = "";
  }

  function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-brand/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <Upload className="h-5 w-5 text-muted mb-1" />
            <span className="text-[10px] text-muted">
              {uploading ? "Uploading..." : "Add Photo"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      <p className="text-[10px] text-subtle">{photos.length}/{maxPhotos} photos. Max 5MB each.</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/listing/PhotoUpload.tsx
git commit -m "feat: add PhotoUpload component with Supabase Storage integration"
```

---

## Task 11: Convert Homepage to Supabase Data

**Files:**
- Modify: `app/(main)/page.tsx`

- [ ] **Step 1: Replace mock data imports with Supabase queries**

Read current `app/(main)/page.tsx`. Replace the mock data imports and usage:

Replace:
```tsx
import { CATEGORIES } from "@/lib/data/categories";
import { LISTINGS } from "@/lib/data/listings";
```

With:
```tsx
import { createClient } from "@/lib/supabase/server";
```

Replace the data fetching at the top of the component:
```tsx
export default async function HomePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: recentListings } = await supabase
    .from("listings")
    .select("*, profiles(display_name, avatar_initials, profile_image)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: featuredListings } = await supabase
    .from("listings")
    .select("*, profiles(display_name, avatar_initials, profile_image)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  // ... rest of JSX uses categories, recentListings, featuredListings
```

Update JSX to use the Supabase data (snake_case from DB). The `ListingCard` and `CategoryCard` components will need minor updates to accept DB row shapes — or map inline.

IMPORTANT: Since `ListingCard` currently expects the frontend `Listing` type with camelCase fields, you'll need to either:
- Map DB rows to frontend types using `dbListingToListing()` from `lib/types/index.ts`
- Or update ListingCard to accept both formats

Use the mapping approach for now — cleaner:
```tsx
import { dbListingToListing } from "@/lib/types";

// In JSX:
{(featuredListings ?? []).map((row) => {
  const listing = dbListingToListing(row);
  return <ListingCard key={listing.id} listing={listing} />;
})}
```

- [ ] **Step 2: Verify homepage loads from Supabase**

Open http://localhost:3000 — will show empty until seed script runs, but should not error.

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/page.tsx
git commit -m "feat: fetch homepage data from Supabase instead of mock imports"
```

---

## Task 12: Convert Browse Page to Supabase Data

**Files:**
- Modify: `components/browse/BrowseContent.tsx`
- Modify: `app/(main)/browse/page.tsx`

- [ ] **Step 1: Rewrite BrowseContent to use Supabase with pagination**

The BrowseContent is a client component (needs `useSearchParams`). It should use the browser Supabase client for queries:

Replace mock imports with Supabase client and add pagination:

```tsx
// components/browse/BrowseContent.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategoryCard } from "@/components/category/CategoryCard";
import { ListingCard } from "@/components/listing/ListingCard";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { dbListingToListing } from "@/lib/types";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export function BrowseContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Always fetch categories
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      setCategories((cats ?? []) as Category[]);

      if (!categoryId) {
        // Fetch listing counts per category
        const counts: Record<string, number> = {};
        for (const cat of (cats ?? [])) {
          const { count } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("status", "active");
          counts[cat.id] = count ?? 0;
        }
        setListingCounts(counts);
        setLoading(false);
        return;
      }

      // Fetch category detail + paginated listings
      const cat = (cats ?? []).find((c: any) => c.id === categoryId) as Category | undefined;
      setCategory(cat ?? null);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count } = await supabase
        .from("listings")
        .select("*, profiles(display_name, avatar_initials)", { count: "exact" })
        .eq("category_id", categoryId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(from, to);

      setListings(data ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    }

    fetchData();
  }, [categoryId, page]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface2 rounded w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-32 bg-surface2 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categoryId) {
    const totalListings = Object.values(listingCounts).reduce((a, b) => a + b, 0);
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">
          Browse Categories
        </h1>
        <p className="text-muted text-sm mb-8">
          Explore {categories.length} categories with {totalListings} active listings
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="relative">
              <CategoryCard category={cat} />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-subtle">
                {listingCounts[cat.id] ?? 0} listing{(listingCounts[cat.id] ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <EmptyState message="Category not found" icon="🔍" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/browse" className="hover:text-brand transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Categories
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{category.icon}</span>
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">{category.name}</h1>
          <p className="text-sm text-muted">{category.description}</p>
        </div>
      </div>
      {category.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 mb-8">
          <span className="px-3 py-1 text-xs rounded-full bg-brand text-white font-medium">
            All ({totalCount})
          </span>
          {category.subcategories.map((sub) => (
            <span
              key={sub}
              className="px-3 py-1 text-xs rounded-full bg-surface2 text-muted border border-border hover:border-brand/30 cursor-pointer transition-colors"
            >
              {sub}
            </span>
          ))}
        </div>
      )}
      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((row) => {
              const listing = dbListingToListing(row);
              return <ListingCard key={listing.id} listing={listing} />;
            })}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/browse"
            searchParams={{ category: categoryId }}
          />
        </>
      ) : (
        <EmptyState message={`No listings in ${category.name} yet`} icon="📭" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/browse/BrowseContent.tsx
git commit -m "feat: fetch browse data from Supabase with pagination"
```

---

## Task 13: Convert Listing Detail Page to Supabase Data

**Files:**
- Modify: `app/(main)/listing/[id]/page.tsx`
- Modify: `components/listing/OfferButton.tsx`

- [ ] **Step 1: Update listing detail page**

Read current file. Replace mock data imports with Supabase server client:

Replace:
```tsx
import { LISTINGS } from "@/lib/data/listings";
import { USERS } from "@/lib/data/users";
import { CATEGORIES } from "@/lib/data/categories";
import { OFFERS } from "@/lib/data/offers";
import { REVIEWS } from "@/lib/data/reviews";
```

With:
```tsx
import { createClient } from "@/lib/supabase/server";
import { REVIEWS } from "@/lib/data/reviews"; // stays as mock for now
```

Update `generateMetadata` and the page component to fetch from Supabase:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("title, city, description, photos").eq("id", id).single();
  if (!listing) return { title: "Listing Not Found | TradeHub" };
  return {
    title: `${listing.title} in ${listing.city} | TradeHub`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.photos.length > 0 ? [listing.photos[0]] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <EmptyState message="Listing not found" icon="🔍" />
      </div>
    );
  }

  const { data: seller } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", listing.user_id)
    .single();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", listing.category_id)
    .single();

  const { data: offers } = await supabase
    .from("offers")
    .select("*, profiles(display_name, avatar_initials)")
    .eq("listing_id", id);

  const { data: similarListings } = await supabase
    .from("listings")
    .select("*, profiles(display_name, avatar_initials)")
    .eq("category_id", listing.category_id)
    .neq("id", id)
    .eq("status", "active")
    .limit(4);
```

Then update all the JSX to use snake_case field names from the DB rows, or map them through the conversion helpers.

For reviews, keep using the mock `REVIEWS` data filtered by seller ID — this stays until the reviews sub-project.

- [ ] **Step 2: Update OfferButton to use Supabase**

Read current `components/listing/OfferButton.tsx`. Replace `useAuthStore` with Supabase:

```tsx
// Replace:
import { useAuthStore } from "@/store/authStore";
// With:
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// In component:
const supabase = createClient();
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setCurrentUserId(user?.id ?? null);
  });
}, []);

const isOwner = currentUserId === listing.user_id;
```

Update the "Send Offer" button to actually insert into Supabase:
```tsx
async function handleSendOffer() {
  if (!currentUserId || !offerAmount) return;
  await supabase.from("offers").insert({
    listing_id: listing.id,
    buyer_id: currentUserId,
    offer_amount: parseFloat(offerAmount),
    message: offerMessage,
  });
  // Close dialog and refresh
  window.location.reload();
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/listing/\[id\]/page.tsx components/listing/OfferButton.tsx
git commit -m "feat: fetch listing detail from Supabase, real offer creation"
```

---

## Task 14: Convert Search Page to Supabase Data

**Files:**
- Modify: `components/search/SearchContent.tsx`

- [ ] **Step 1: Rewrite SearchContent with Supabase queries and pagination**

Read current file. Replace mock data with Supabase browser client queries:

Key changes:
- Replace `useListingsStore` and `useRegionStore` with Supabase client
- Search via `supabase.from("listings").select("*", { count: "exact" }).or("title.ilike.%query%,description.ilike.%query%")`
- Add pagination using `Pagination` component
- Keep filter sidebar working with Supabase `.eq()` chains

The search should support:
- Text search: `.or('title.ilike.%q%,description.ilike.%q%')`
- Category filter: `.eq('category_id', categoryId)`
- Price range: `.gte('price', min).lte('price', max)`
- Condition filter: `.eq('condition', condition)`
- Price type filter: `.eq('price_type', priceType)`
- Pagination: `.range(from, to)` with page numbers

- [ ] **Step 2: Commit**

```bash
git add components/search/SearchContent.tsx
git commit -m "feat: search with Supabase queries and pagination"
```

---

## Task 15: Convert Post-New Page to Supabase

**Files:**
- Modify: `app/(main)/post-new/page.tsx`

- [ ] **Step 1: Rewrite post-new page with real Supabase insert and photo upload**

Read current file. Key changes:
- Remove `useListingsStore` import
- Add `createClient` from `@/lib/supabase/client`
- Fetch categories from Supabase instead of mock import
- Use `PhotoUpload` component for photos
- Get current user from Supabase auth
- On submit: insert into `listings` table via Supabase
- Redirect to the new listing page after successful insert

Replace the submit handler:
```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.push("/login");
    return;
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      category_id: categoryId,
      subcategory,
      title,
      description,
      price: parseFloat(price) || 0,
      price_type: priceType,
      condition,
      condition_notes: conditionNotes,
      city,
      photos,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    })
    .select("id")
    .single();

  if (error) {
    setError(error.message);
    setSubmitting(false);
    return;
  }

  router.push(`/listing/${data.id}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(main\)/post-new/page.tsx
git commit -m "feat: post new listings to Supabase with photo upload"
```

---

## Task 16: Delete Mock Data Files and Old Stores

**Files:**
- Delete: `lib/data/listings.ts`
- Delete: `lib/data/users.ts`
- Delete: `lib/data/categories.ts`
- Delete: `lib/data/offers.ts`
- Delete: `store/listingsStore.ts`
- Delete: `store/authStore.ts`

- [ ] **Step 1: Delete files**

```bash
rm lib/data/listings.ts lib/data/users.ts lib/data/categories.ts lib/data/offers.ts
rm store/listingsStore.ts store/authStore.ts
```

- [ ] **Step 2: Check for remaining imports**

```bash
grep -r "lib/data/listings" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "lib/data/users" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "lib/data/categories" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "lib/data/offers" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "store/listingsStore" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "store/authStore" app/ components/ --include="*.tsx" --include="*.ts"
```

Expected: No results (all imports should have been replaced in previous tasks). If any remain, fix them.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "chore: remove mock data files and old stores replaced by Supabase"
```

---

## Task 17: Create Seed Script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create the seed script**

Read the current mock data files before they are deleted (or use git to retrieve them). The seed script needs to:

1. Read mock data from the existing data files
2. Create auth users for each mock user
3. Update profiles with mock user data
4. Insert categories
5. Insert listings (mapping old user IDs to new UUIDs)
6. Insert offers (mapping old IDs)

```ts
// scripts/seed.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Import mock data (these files must exist when running seed)
// Copy the data inline or import from a seed-data file

async function seed() {
  console.log("Seeding database...");

  // Step 1: Seed categories
  const categories = [
    // Paste full categories array from lib/data/categories.ts
    // Each object: { id, name, slug, icon, description, is_hot, subcategories }
  ];

  const { error: catError } = await supabase
    .from("categories")
    .upsert(categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      is_hot: c.isHot,
      subcategories: c.subcategories,
    })));

  if (catError) console.error("Categories error:", catError);
  else console.log(`Seeded ${categories.length} categories`);

  // Step 2: Create auth users and update profiles
  const mockUsers = [
    // Paste full users array from lib/data/users.ts
  ];

  const userIdMap: Record<string, string> = {};

  for (const user of mockUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${user.id}@tradehub-seed.local`,
      password: "seedpassword123",
      email_confirm: true,
      user_metadata: { full_name: user.displayName },
    });

    if (error) {
      console.error(`User ${user.id} error:`, error.message);
      continue;
    }

    userIdMap[user.id] = data.user.id;

    await supabase.from("profiles").update({
      display_name: user.displayName,
      avatar_initials: user.avatarInitials,
      profile_image: user.profileImage || null,
      city: user.city,
      bio: user.bio,
      is_verified: user.isVerified,
      rating_avg: user.ratingAvg,
      review_count: user.reviewCount,
      trust_score: user.trustScore,
      response_rate: user.responseRate,
      listing_count: user.listingCount,
    }).eq("id", data.user.id);

    console.log(`Created user: ${user.displayName} -> ${data.user.id}`);
  }

  // Step 3: Seed listings
  const mockListings = [
    // Paste full listings array from lib/data/listings.ts
  ];

  const listingIdMap: Record<string, string> = {};

  for (const listing of mockListings) {
    const userId = userIdMap[listing.userId];
    if (!userId) { console.warn(`Skipping listing ${listing.id}: no user mapping`); continue; }

    const { data, error } = await supabase.from("listings").insert({
      user_id: userId,
      category_id: listing.categoryId,
      subcategory: listing.subcategory,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      price_type: listing.priceType,
      condition: listing.condition,
      condition_notes: listing.conditionNotes,
      city: listing.city,
      photos: listing.photos,
      status: listing.status,
      tags: listing.tags,
    }).select("id").single();

    if (error) { console.error(`Listing ${listing.id} error:`, error.message); continue; }
    listingIdMap[listing.id] = data.id;
    console.log(`Created listing: ${listing.title} -> ${data.id}`);
  }

  // Step 4: Seed offers
  const mockOffers = [
    // Paste full offers array from lib/data/offers.ts
  ];

  for (const offer of mockOffers) {
    const listingId = listingIdMap[offer.listingId];
    const buyerId = userIdMap[offer.buyerId];
    if (!listingId || !buyerId) { console.warn(`Skipping offer ${offer.id}`); continue; }

    await supabase.from("offers").insert({
      listing_id: listingId,
      buyer_id: buyerId,
      offer_amount: offer.offerAmount,
      trade_description: offer.tradeDescription,
      status: offer.status,
      message: offer.message,
    });
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
```

IMPORTANT: The implementer must read and copy the actual mock data arrays from `lib/data/categories.ts`, `lib/data/users.ts`, `lib/data/listings.ts`, `lib/data/offers.ts` into the seed script before those files are deleted. The data arrays should be pasted inline in the script where the comments indicate.

- [ ] **Step 2: Run the seed script**

```bash
npx tsx scripts/seed.ts
```

Expected: Logs showing seeded categories, users, listings, offers.

- [ ] **Step 3: Verify data in Supabase Dashboard**

Go to Supabase Dashboard > Table Editor and check:
- `categories` has rows
- `profiles` has rows
- `listings` has rows with valid `user_id` references
- `offers` has rows

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed script to populate Supabase with mock data"
```

---

## Task 18: Final Build Verification and Cleanup

**Files:**
- Various cleanup

- [ ] **Step 1: Run the build**

```bash
cd /Users/jintanakhomwong/Documents/GitHub/tradehub-next && npx next build 2>&1
```

Fix any type errors or missing imports.

- [ ] **Step 2: Verify all key pages in browser**

- http://localhost:3000 — Homepage loads listings from Supabase
- http://localhost:3000/browse — Categories with listing counts
- http://localhost:3000/browse?category=electronics — Paginated listings
- http://localhost:3000/listing/{id} — Detail page (use a real UUID from seeded data)
- http://localhost:3000/search?q=bike — Search works
- http://localhost:3000/register — Registration form with Google button
- http://localhost:3000/login — Login form
- http://localhost:3000/post-new — Requires login, photo upload works

- [ ] **Step 3: Test auth flow**

1. Register a new account via email
2. Verify profile created in Supabase Dashboard
3. Log out via Navbar
4. Log back in
5. Try accessing /post-new while logged out (should redirect to /login)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final cleanup and fixes for Supabase integration"
```
