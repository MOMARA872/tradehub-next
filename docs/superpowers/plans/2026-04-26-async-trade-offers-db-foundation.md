# Async Trade Offers — Plan 1 of 5: DB Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the entire database layer for the Trade Offers feature — migration file, stored functions, RLS policies, and SQL verification scenarios. After this plan, the DB layer is fully working and tested with no UI yet.

**Architecture:** A single migration `supabase/migrations/015_trade_offers.sql` extends the existing `offers` table with an `offer_type` discriminator, adds `offer_items` join table, extends `listings.status` and `threads`, and adds 6 SECURITY DEFINER stored functions for atomic state transitions. RLS policies make trade offers publicly readable; all status changes flow through stored functions (clients can't UPDATE offers directly). Verification scenarios live in `supabase/tests/database/` and run via plain `psql` — no pgTAP needed.

**Tech Stack:** Supabase (Postgres 15), Supabase CLI for local testing. Functions in plpgsql.

**Spec reference:** `docs/superpowers/specs/2026-04-26-async-trade-offers-design.md` — sections 7, 8, 11, 13.

**Plans 2–5 (built on top, not part of this plan):**
- Plan 2 — Server actions + Make Trade Offer flow
- Plan 3 — Listing Offers Dashboard (Accept/Counter/Pass UI)
- Plan 4 — Trade Inbox + threads + completion handshake
- Plan 5 — Pass List discovery + notifications wiring + rate limits + E2E

---

## Setup notes for the implementing engineer

If you don't have Supabase CLI running locally:
```bash
# from the repo root
supabase start                 # starts local Postgres + Studio
supabase status                # prints local DB URL — save as $LOCAL_DB
```

Throughout this plan we'll use:
```bash
export LOCAL_DB="$(supabase status -o json | jq -r .DB_URL)"
# or copy the "DB URL" line from `supabase status` manually
```

You also need a Postgres client (`psql`) on PATH. The Supabase CLI does NOT install one. Recommended:
```bash
brew install libpq
# libpq is keg-only; do NOT brew link --force (collides with the system libpq).
# Instead, prepend its bin to PATH for this shell:
export PATH="$(brew --prefix libpq)/bin:$PATH"
psql --version   # should print e.g. psql (PostgreSQL) 18.x
```
For persistent use across new shells, add the `export PATH=...` line to your `~/.zshrc`. (Not required for this plan — each subagent's commands will inline the PATH export.)

To re-apply migrations from scratch (used after every migration edit):
```bash
supabase db reset    # drops local DB, re-runs ALL migrations in order
```

To run a verification script (every `psql ...` line in this plan assumes `psql` is on PATH per the setup above):
```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_<name>.sql
# Exit code 0 = passed. Any "raise exception" = failed.
```

---

## File Structure

### New files
- `supabase/migrations/015_trade_offers.sql` — the entire migration (built up incrementally across tasks)
- `supabase/tests/database/README.md` — how to run the tests
- `supabase/tests/database/test_create_trade_offer.sql`
- `supabase/tests/database/test_pass_offer.sql`
- `supabase/tests/database/test_withdraw_offer.sql`
- `supabase/tests/database/test_counter_offer.sql`
- `supabase/tests/database/test_accept_offer_basic.sql`
- `supabase/tests/database/test_accept_offer_listing_wide_autopass.sql`
- `supabase/tests/database/test_accept_offer_item_overlap_autopass.sql`
- `supabase/tests/database/test_mark_offer_complete.sql`
- `supabase/tests/database/test_listing_status_trigger.sql`
- `supabase/tests/database/test_rls_anonymous_read.sql`
- `supabase/tests/database/test_e2e_happy_path.sql`
- `supabase/tests/database/test_e2e_counter_chain.sql`
- `supabase/tests/database/_helpers.sql` — shared test fixtures (create_test_user, create_test_listing)

### Modified files
- None (this plan only adds files; no existing migrations or code change)

---

## Task 1: Create migration scaffold and test directory

**Files:**
- Create: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/README.md`
- Create: `supabase/tests/database/_helpers.sql`

- [ ] **Step 1: Create the migration file with header**

```bash
cat > supabase/migrations/015_trade_offers.sql << 'EOF'
-- supabase/migrations/015_trade_offers.sql
-- Async Trade Offers — DB foundation
-- Spec: docs/superpowers/specs/2026-04-26-async-trade-offers-design.md
--
-- This migration extends the existing offers table with an offer_type
-- discriminator and adds offer_items, listing 'in_trade' status,
-- threads.pinned_offer_id, notification types, RLS, and 6 stored
-- functions for atomic state transitions.

EOF
```

- [ ] **Step 2: Create the tests directory and README**

```bash
mkdir -p supabase/tests/database
cat > supabase/tests/database/README.md << 'EOF'
# Trade Offers DB Tests

Plain-SQL verification scenarios. Each script runs end-to-end and
uses `raise exception` for assertions. Exit code 0 = pass.

## Running

```bash
export LOCAL_DB="$(supabase status -o json | jq -r .DB_URL)"
supabase db reset          # apply all migrations
psql "$LOCAL_DB" -f supabase/tests/database/test_<name>.sql
```

## Running all
```bash
for f in supabase/tests/database/test_*.sql; do
  echo "=== $f ===" && psql "$LOCAL_DB" -f "$f" || break
done
```
EOF
```

- [ ] **Step 3: Create the shared helpers script**

```bash
cat > supabase/tests/database/_helpers.sql << 'EOF'
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
EOF
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/
git commit -m "feat(trade-offers): scaffold migration and test directory"
```

---

## Task 2: Add `set_updated_at` helper trigger function

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append helper function to migration**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- Helper trigger function (re-usable)
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

Expected: completes without error.

- [ ] **Step 3: Verify the function exists**

```bash
psql "$LOCAL_DB" -c "select proname from pg_proc where proname = 'set_updated_at';"
```

Expected output contains: `set_updated_at`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): add set_updated_at helper"
```

---

## Task 3: Extend `offers` table with new columns

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append schema changes**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- offers table extensions
-- ============================================================

-- Drop old declined-only check; we'll add a richer one below
alter table offers drop constraint offers_status_check;

-- Migrate existing 'declined' rows to 'passed' (no-rejection policy)
update offers set status = 'passed' where status = 'declined';

-- New columns
alter table offers
  add column offer_type      text not null default 'cash'
    check (offer_type in ('cash', 'trade')),
  add column proposer_id     uuid references profiles(id) on delete cascade,
  add column parent_offer_id uuid references offers(id)   on delete set null,
  add column updated_at      timestamptz not null default now(),
  add column completed_by_buyer  boolean not null default false,
  add column completed_by_seller boolean not null default false;

-- Backfill proposer_id for existing rows (cash offers were sent by the buyer)
update offers set proposer_id = buyer_id where proposer_id is null;
alter table offers alter column proposer_id set not null;

-- Richer status check (8 states)
alter table offers add constraint offers_status_check check (status in (
  'pending',
  'accepted',
  'countered',
  'passed',
  'auto_passed_listing',
  'auto_passed_item_taken',
  'withdrawn',
  'completed'
));

-- updated_at trigger
drop trigger if exists offers_set_updated_at on offers;
create trigger offers_set_updated_at
  before update on offers
  for each row execute function set_updated_at();

-- Indexes
create index if not exists idx_offers_parent         on offers(parent_offer_id);
create index if not exists idx_offers_proposer       on offers(proposer_id);
create index if not exists idx_offers_listing_status on offers(listing_id, status);
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

Expected: completes without error.

- [ ] **Step 3: Verify schema with psql**

```bash
psql "$LOCAL_DB" -c "\d offers" | grep -E "offer_type|proposer_id|parent_offer_id|completed_by"
```

Expected: shows the 5 new columns.

- [ ] **Step 4: Verify the status constraint**

```bash
psql "$LOCAL_DB" -c "
insert into offers (listing_id, buyer_id, proposer_id, status)
values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'invalid_status');
"
```

Expected: ERROR mentioning `offers_status_check` (constraint blocks invalid status). The dummy UUIDs will fail FK first, but if you fix that and try, the status check fires.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): extend offers table with type, proposer, parent_offer, completion flags"
```

---

## Task 4: Create `offer_items` table with 5-item cap trigger

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append table + trigger**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- offer_items: structured items in a trade offer
-- offers.listing_id  = SELLER's listing being traded for
-- offer_items.listing_id = BUYER's listings being put up
-- ============================================================

create table offer_items (
  offer_id   uuid not null references offers(id)   on delete cascade,
  listing_id uuid not null references listings(id) on delete restrict,
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (offer_id, listing_id)
);

create index idx_offer_items_listing on offer_items(listing_id);

-- Cap of 5 items per offer
create or replace function enforce_offer_item_cap()
returns trigger as $$
begin
  if (select count(*) from offer_items where offer_id = new.offer_id) >= 5 then
    raise exception 'Trade offer cannot include more than 5 items';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger offer_items_cap before insert on offer_items
  for each row execute function enforce_offer_item_cap();
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

Expected: success.

- [ ] **Step 3: Verify table exists with the right shape**

```bash
psql "$LOCAL_DB" -c "\d offer_items"
```

Expected: shows `offer_id`, `listing_id`, `position`, `created_at` with PK on (offer_id, listing_id).

- [ ] **Step 4: Smoke-test the 5-item cap**

```bash
psql "$LOCAL_DB" << 'EOF'
do $$
declare
  v_offer uuid := gen_random_uuid();
begin
  -- Insert a placeholder offer (FK will fail without a real listing+buyer, so disable triggers temporarily)
  set session_replication_role = replica;
  insert into offers (id, listing_id, buyer_id, proposer_id)
    values (v_offer, gen_random_uuid(), gen_random_uuid(), gen_random_uuid());
  -- Insert 5 items
  for i in 1..5 loop
    insert into offer_items (offer_id, listing_id, position)
      values (v_offer, gen_random_uuid(), i);
  end loop;
  set session_replication_role = default;
  -- 6th should fail
  begin
    insert into offer_items (offer_id, listing_id, position)
      values (v_offer, gen_random_uuid(), 6);
    raise exception 'TEST FAILED: 6th insert should have raised';
  exception when others then
    if sqlerrm not like '%more than 5 items%' then
      raise exception 'TEST FAILED: wrong error: %', sqlerrm;
    end if;
  end;
  raise notice 'PASS: 5-item cap enforced';
end $$;
EOF
```

Expected: `NOTICE:  PASS: 5-item cap enforced`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): add offer_items table with 5-item cap trigger"
```

---

## Task 5: Extend `listings.status` to include `'in_trade'`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append schema change**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- listings: add 'in_trade' status (between accept and complete)
-- IMPORTANT: 'paused' was added by migration 008 (Stripe billing —
-- paused when a pro subscription lapses). It MUST be preserved here.
-- The Stripe webhook in app/api/webhooks/stripe/route.ts reads/writes
-- status='paused'.
-- Use "if exists" on the drop to match migration 008's pattern and
-- survive partial replays.
-- ============================================================

alter table listings drop constraint if exists listings_status_check;
alter table listings add constraint listings_status_check
  check (status in ('active', 'sold', 'expired', 'paused', 'in_trade'));
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Verify the constraint accepts the new value**

```bash
psql "$LOCAL_DB" << 'EOF'
do $$
declare
  v_user uuid := gen_random_uuid();
  v_listing uuid;
begin
  set session_replication_role = replica;
  insert into auth.users (id, email, aud, role, instance_id)
    values (v_user, 't@test.local', 'authenticated', 'authenticated',
            '00000000-0000-0000-0000-000000000000');
  insert into profiles (id, display_name) values (v_user, 'T');
  insert into categories (id, name, slug, icon)
    values ('c', 'C', 'c', '.') on conflict do nothing;
  insert into listings (id, user_id, category_id, title, status)
    values (gen_random_uuid(), v_user, 'c', 'x', 'in_trade')
    returning id into v_listing;
  set session_replication_role = default;
  raise notice 'PASS: in_trade status accepted';
end $$;
EOF
```

Expected: `NOTICE:  PASS: in_trade status accepted`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): add in_trade to listings.status constraint"
```

---

## Task 6: Add `pinned_offer_id` to threads

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append schema change**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- threads: pin an offer to a thread (for accepted trades)
-- ============================================================

alter table threads
  add column pinned_offer_id uuid references offers(id) on delete set null;

create index idx_threads_pinned_offer on threads(pinned_offer_id);
EOF
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db reset
psql "$LOCAL_DB" -c "\d threads" | grep pinned_offer_id
```

Expected: shows `pinned_offer_id` column.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): add threads.pinned_offer_id"
```

---

## Task 7: Extend `notifications.type` with 7 new trade types

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append schema change**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- notifications: add 7 trade-offer notification types
-- ============================================================

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in (
    -- existing types (preserved)
    'offer_received', 'offer_accepted', 'offer_declined', 'offer_countered',
    'new_message_thread', 'new_message', 'review_received',
    -- new trade-offer types
    'trade_offer_received',
    'trade_offer_countered',
    'trade_offer_accepted',
    'trade_offer_passed',
    'trade_offer_auto_passed',
    'trade_offer_withdrawn',
    'trade_offer_completed'
  ));
EOF
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db reset
psql "$LOCAL_DB" -c "
insert into notifications (user_id, type, title)
values ('00000000-0000-0000-0000-000000000000', 'trade_offer_received', 'test');
" 2>&1 | head -5
```

Expected: errors on the FK to user_id (good — that means the type check passed). If the type check fired instead, the message would mention `notifications_type_check`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): add 7 trade-offer notification types"
```

---

## Task 8: Update RLS policies on `offers`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append RLS changes**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- RLS: offers
-- Trade offers are publicly readable (anyone, even logged out).
-- Cash offers stay participant-only.
-- All UPDATEs go through SECURITY DEFINER stored functions —
-- clients can never UPDATE offers directly.
-- ============================================================

drop policy "Offer participants can read offers" on offers;
drop policy "Offer participants can update offers" on offers;

create policy "Trade offers public; cash offers participant-only"
  on offers for select using (
    offer_type = 'trade'
    or auth.uid() = buyer_id
    or auth.uid() = proposer_id
    or auth.uid() in (select user_id from listings where id = listing_id)
  );

-- Replace insert policy: proposer must be the authenticated user
drop policy "Authenticated users can create offers" on offers;
create policy "Authenticated users can create offers as proposer"
  on offers for insert with check (auth.uid() = proposer_id);
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Verify policies exist**

```bash
psql "$LOCAL_DB" -c "
select polname from pg_policy
where polrelid = 'offers'::regclass
order by polname;"
```

Expected: lists `Trade offers public; cash offers participant-only` and `Authenticated users can create offers as proposer`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): update offers RLS for public trade visibility"
```

---

## Task 9: Add RLS policies on `offer_items`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`

- [ ] **Step 1: Append RLS for offer_items**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- RLS: offer_items
-- ============================================================

alter table offer_items enable row level security;

create policy "Offer items follow parent offer visibility"
  on offer_items for select using (
    exists (
      select 1 from offers o
      where o.id = offer_items.offer_id
        and (o.offer_type = 'trade'
             or auth.uid() = o.buyer_id
             or auth.uid() = o.proposer_id
             or auth.uid() in (select user_id from listings where id = o.listing_id))
    )
  );

create policy "Proposer can add items to own pending offer"
  on offer_items for insert with check (
    exists (
      select 1 from offers
      where id = offer_id and proposer_id = auth.uid() and status = 'pending'
    )
  );
EOF
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db reset
psql "$LOCAL_DB" -c "
select polname from pg_policy where polrelid = 'offer_items'::regclass order by polname;"
```

Expected: lists the two new policies.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql
git commit -m "feat(trade-offers): add offer_items RLS policies"
```

---

## Task 10: Implement `create_trade_offer()` function

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_create_trade_offer.sql`

- [ ] **Step 1: Append function to migration**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- create_trade_offer
-- Caller: authenticated user (the buyer/proposer)
-- ============================================================

create or replace function create_trade_offer(
  p_listing_id uuid,
  p_item_ids   uuid[],
  p_message    text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposer uuid := auth.uid();
  v_owner    uuid;
  v_offer_id uuid;
  v_item_id  uuid;
  v_pos      smallint := 0;
begin
  if v_proposer is null then
    raise exception 'Authentication required';
  end if;

  if array_length(p_item_ids, 1) is null or array_length(p_item_ids, 1) < 1 then
    raise exception 'Must include at least 1 item';
  end if;
  if array_length(p_item_ids, 1) > 5 then
    raise exception 'Cannot include more than 5 items';
  end if;

  -- Validate target listing
  select user_id into v_owner from listings
    where id = p_listing_id and status = 'active'
    for update;
  if v_owner is null then
    raise exception 'Listing not found or not active';
  end if;
  if v_owner = v_proposer then
    raise exception 'Cannot make offer on your own listing';
  end if;

  -- Validate each offered item
  foreach v_item_id in array p_item_ids loop
    if not exists (
      select 1 from listings
      where id = v_item_id and user_id = v_proposer and status = 'active'
    ) then
      raise exception 'Item % is not yours or not active', v_item_id;
    end if;
  end loop;

  -- Insert offer
  insert into offers (
    listing_id, buyer_id, proposer_id, offer_type, status, message, offer_amount
  ) values (
    p_listing_id, v_proposer, v_proposer, 'trade', 'pending',
    coalesce(p_message, ''), 0
  ) returning id into v_offer_id;

  -- Insert items
  foreach v_item_id in array p_item_ids loop
    insert into offer_items (offer_id, listing_id, position)
    values (v_offer_id, v_item_id, v_pos);
    v_pos := v_pos + 1;
  end loop;

  -- Notify the listing owner
  insert into notifications (user_id, type, title, body, link)
  values (
    v_owner, 'trade_offer_received',
    'New trade offer',
    'You have a new trade offer with ' || array_length(p_item_ids, 1) || ' item(s).',
    '/listings/' || p_listing_id || '/offers'
  );

  return v_offer_id;
end;
$$;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the test**

```bash
cat > supabase/tests/database/test_create_trade_offer.sql << 'EOF'
-- supabase/tests/database/test_create_trade_offer.sql
\i supabase/tests/database/_helpers.sql

do $$
declare
  v_alice uuid;
  v_bob   uuid;
  v_camera uuid;
  v_bike   uuid;
  v_helmet uuid;
  v_offer  uuid;
  v_count  int;
begin
  perform _test_cleanup();

  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_helmet := _test_create_listing(v_bob, 'Helmet');

  -- Simulate Bob calling the function
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike, v_helmet], 'fair trade?');

  -- Verify
  select count(*) into v_count from offers
    where id = v_offer and status = 'pending' and offer_type = 'trade'
      and buyer_id = v_bob and proposer_id = v_bob and listing_id = v_camera;
  if v_count <> 1 then raise exception 'offer row wrong'; end if;

  select count(*) into v_count from offer_items where offer_id = v_offer;
  if v_count <> 2 then raise exception 'item count wrong: %', v_count; end if;

  select count(*) into v_count from notifications
    where user_id = v_alice and type = 'trade_offer_received';
  if v_count <> 1 then raise exception 'notification missing'; end if;

  -- Self-offer must fail
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  begin
    perform create_trade_offer(v_camera, array[v_bike], '');
    raise exception 'TEST FAILED: self-offer was allowed';
  exception when others then
    if sqlerrm not like '%own listing%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  -- 6 items must fail
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  begin
    perform create_trade_offer(v_camera,
      array[v_bike, v_helmet, v_bike, v_helmet, v_bike, v_helmet], '');
    raise exception 'TEST FAILED: 6 items was allowed';
  exception when others then
    if sqlerrm not like '%more than 5%' and sqlerrm not like '%5 items%' then
      raise exception 'wrong error: %', sqlerrm;
    end if;
  end;

  raise notice 'PASS: create_trade_offer';
  perform _test_cleanup();
end $$;
EOF
```

> **Note on `auth.uid()` in tests:** Supabase's `auth.uid()` reads from `request.jwt.claim.sub`. Setting it via `set_config` simulates a logged-in user inside a single transaction.

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_create_trade_offer.sql
```

Expected: `NOTICE:  PASS: create_trade_offer`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_create_trade_offer.sql
git commit -m "feat(trade-offers): implement create_trade_offer with self-offer + cap guards"
```

---

## Task 11: Implement `pass_offer()` function

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_pass_offer.sql`

- [ ] **Step 1: Append function**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- pass_offer — listing owner passes on an offer
-- ============================================================

create or replace function pass_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_listing_id uuid;
  v_owner      uuid;
  v_buyer      uuid;
  v_status     text;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select listing_id, buyer_id, status into v_listing_id, v_buyer, v_status
    from offers where id = p_offer_id for update;
  if v_status is null then raise exception 'Offer not found'; end if;
  if v_status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_status;
  end if;

  select user_id into v_owner from listings where id = v_listing_id;
  if v_owner <> v_caller then
    raise exception 'Only the listing owner can pass';
  end if;

  update offers set status = 'passed' where id = p_offer_id;

  insert into notifications (user_id, type, title, body, link)
  values (v_buyer, 'trade_offer_passed',
          'Offer passed',
          'The seller passed on your offer.',
          '/listings/' || v_listing_id || '#pass-list');
end;
$$;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the test**

```bash
cat > supabase/tests/database/test_pass_offer.sql << 'EOF'
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
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_pass_offer.sql
```

Expected: `NOTICE:  PASS: pass_offer`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_pass_offer.sql
git commit -m "feat(trade-offers): implement pass_offer"
```

---

## Task 12: Implement `withdraw_offer()` function

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_withdraw_offer.sql`

- [ ] **Step 1: Append function**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- withdraw_offer — proposer pulls back their own offer
-- ============================================================

create or replace function withdraw_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_proposer   uuid;
  v_buyer      uuid;
  v_status     text;
  v_listing_id uuid;
  v_owner      uuid;
  v_recipient  uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select proposer_id, buyer_id, status, listing_id
    into v_proposer, v_buyer, v_status, v_listing_id
    from offers where id = p_offer_id for update;
  if v_status is null then raise exception 'Offer not found'; end if;
  if v_status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_status;
  end if;
  if v_proposer <> v_caller then
    raise exception 'Only the proposer can withdraw';
  end if;

  update offers set status = 'withdrawn' where id = p_offer_id;

  -- Notify the OTHER party (not the withdrawer). For an original buyer offer
  -- the recipient is the listing owner. For a seller-sent counter, the
  -- recipient is the original buyer — avoids self-notification to the seller.
  select user_id into v_owner from listings where id = v_listing_id;
  v_recipient := case when v_caller = v_owner then v_buyer else v_owner end;

  insert into notifications (user_id, type, title, body, link)
  values (v_recipient, 'trade_offer_withdrawn',
          'Offer withdrawn',
          'A pending offer was withdrawn.',
          '/listings/' || v_listing_id || '/offers');
end;
$$;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the test**

```bash
cat > supabase/tests/database/test_withdraw_offer.sql << 'EOF'
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
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_withdraw_offer.sql
```

Expected: `NOTICE:  PASS: withdraw_offer`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_withdraw_offer.sql
git commit -m "feat(trade-offers): implement withdraw_offer"
```

---

## Task 13: Implement `counter_offer()` function

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_counter_offer.sql`

- [ ] **Step 1: Append function**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- counter_offer — receiver of a pending offer counters with a
-- new bundle of items (still drawn from the original buyer's listings).
-- ============================================================

create or replace function counter_offer(
  p_parent_offer_id uuid,
  p_item_ids        uuid[],
  p_message         text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_parent     offers%rowtype;
  v_owner      uuid;
  v_recipient  uuid;
  v_new_id     uuid;
  v_item_id    uuid;
  v_pos        smallint := 0;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  if array_length(p_item_ids, 1) is null or array_length(p_item_ids, 1) < 1 then
    raise exception 'Must include at least 1 item';
  end if;
  if array_length(p_item_ids, 1) > 5 then
    raise exception 'Cannot include more than 5 items';
  end if;

  select * into v_parent from offers where id = p_parent_offer_id for update;
  if v_parent.id is null then raise exception 'Parent offer not found'; end if;
  if v_parent.status <> 'pending' then
    raise exception 'Parent is not pending (status=%)', v_parent.status;
  end if;
  if v_parent.offer_type <> 'trade' then
    raise exception 'Can only counter trade offers';
  end if;

  -- Receiver of this pending offer = whoever is NOT the proposer.
  -- For a chain: receiver alternates each link.
  select user_id into v_owner from listings where id = v_parent.listing_id;
  v_recipient := case
    when v_parent.proposer_id = v_owner then v_parent.buyer_id
    else v_owner
  end;
  if v_recipient <> v_caller then
    raise exception 'Only the receiver can counter';
  end if;

  -- Items must belong to the original buyer (the non-owner side) and be active
  foreach v_item_id in array p_item_ids loop
    if not exists (
      select 1 from listings
      where id = v_item_id and user_id = v_parent.buyer_id and status = 'active'
    ) then
      raise exception 'Item % is not active or not owned by the buyer', v_item_id;
    end if;
  end loop;

  -- Mark parent as countered
  update offers set status = 'countered' where id = v_parent.id;

  -- Insert the counter as a new pending offer
  insert into offers (
    listing_id, buyer_id, proposer_id, parent_offer_id,
    offer_type, status, message, offer_amount
  ) values (
    v_parent.listing_id, v_parent.buyer_id, v_caller, v_parent.id,
    'trade', 'pending', coalesce(p_message, ''), 0
  ) returning id into v_new_id;

  foreach v_item_id in array p_item_ids loop
    insert into offer_items (offer_id, listing_id, position)
    values (v_new_id, v_item_id, v_pos);
    v_pos := v_pos + 1;
  end loop;

  -- Notify the other party (= original proposer of parent)
  insert into notifications (user_id, type, title, body, link)
  values (v_parent.proposer_id, 'trade_offer_countered',
          'Counter offer',
          'You received a counter offer with ' ||
            array_length(p_item_ids, 1) || ' item(s).',
          '/trades/' || v_new_id);

  return v_new_id;
end;
$$;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the test**

```bash
cat > supabase/tests/database/test_counter_offer.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid; v_helmet uuid; v_lock uuid;
  v_offer1 uuid; v_offer2 uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_helmet := _test_create_listing(v_bob, 'Helmet');
  v_lock   := _test_create_listing(v_bob, 'Lock');

  -- Bob's original offer: bike + helmet
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer1 := create_trade_offer(v_camera, array[v_bike, v_helmet], '');

  -- Alice counters: wants bike + helmet + lock
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  v_offer2 := counter_offer(v_offer1, array[v_bike, v_helmet, v_lock], 'add lock');

  -- Parent should be 'countered'
  select status into v_status from offers where id = v_offer1;
  if v_status <> 'countered' then raise exception 'parent status=%', v_status; end if;

  -- Child should be 'pending', proposer = alice, parent_offer_id = v_offer1, buyer = bob
  select status into v_status from offers where id = v_offer2;
  if v_status <> 'pending' then raise exception 'child status=%', v_status; end if;
  if not exists (
    select 1 from offers
    where id = v_offer2 and proposer_id = v_alice and buyer_id = v_bob
      and parent_offer_id = v_offer1 and listing_id = v_camera
  ) then raise exception 'child fields wrong'; end if;

  -- Items must reference Bob's listings (the buyer's), not Alice's
  if not exists (
    select 1 from offer_items oi join listings l on l.id = oi.listing_id
    where oi.offer_id = v_offer2 and l.user_id = v_bob
    having count(*) = 3
  ) then raise exception 'item ownership wrong'; end if;

  -- Bob counters back: just bike (drop helmet + lock)
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform counter_offer(v_offer2, array[v_bike], 'final');

  select status into v_status from offers where id = v_offer2;
  if v_status <> 'countered' then raise exception 'v_offer2 status=%', v_status; end if;

  raise notice 'PASS: counter_offer';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_counter_offer.sql
```

Expected: `NOTICE:  PASS: counter_offer`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_counter_offer.sql
git commit -m "feat(trade-offers): implement counter_offer with alternating proposer"
```

---

## Task 14: Implement `accept_offer()` — basic acceptance

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_accept_offer_basic.sql`

This is the heaviest function. We build it up across Tasks 14, 15, 16:
- **14** — basic: lock, set accepted, flip listings to in_trade, create/reuse thread + pin, notify buyer
- **15** — listing-wide auto-pass (Section 5.4 of spec)
- **16** — item-overlap auto-pass

- [ ] **Step 1: Append the basic version of accept_offer**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- accept_offer — listing owner accepts a pending offer.
-- Atomically: sets status, flips involved listings to 'in_trade',
-- creates/reuses a thread and pins the offer, notifies the buyer.
-- (Listing-wide and item-overlap auto-pass added in Tasks 15-16.)
-- ============================================================

create or replace function accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_offer      offers%rowtype;
  v_owner      uuid;
  v_thread_id  uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_offer from offers where id = p_offer_id for update;
  if v_offer.id is null then raise exception 'Offer not found'; end if;
  if v_offer.status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_offer.status;
  end if;

  select user_id into v_owner from listings where id = v_offer.listing_id;
  if v_owner <> v_caller then
    raise exception 'Only the listing owner can accept';
  end if;

  -- Set this offer accepted
  update offers set status = 'accepted' where id = v_offer.id;

  -- Flip the seller's listing + all offered items to 'in_trade'
  update listings set status = 'in_trade' where id = v_offer.listing_id;
  update listings set status = 'in_trade'
    where id in (select listing_id from offer_items where offer_id = v_offer.id);

  -- Create or reuse a thread between owner and buyer for this listing
  insert into threads (listing_id, buyer_id, seller_id, listing_title, pinned_offer_id)
    values (v_offer.listing_id, v_offer.buyer_id, v_owner,
            (select title from listings where id = v_offer.listing_id),
            v_offer.id)
    on conflict (listing_id, buyer_id) do update
      set pinned_offer_id = excluded.pinned_offer_id
    returning id into v_thread_id;

  -- Notify buyer
  insert into notifications (user_id, type, title, body, link)
  values (v_offer.buyer_id, 'trade_offer_accepted',
          'Offer accepted!',
          'Your trade offer was accepted. Open the chat to coordinate.',
          '/threads/' || v_thread_id);
end;
$$;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the basic acceptance test**

```bash
cat > supabase/tests/database/test_accept_offer_basic.sql << 'EOF'
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

  -- Bob (non-owner) cannot accept his own offer
  begin
    perform accept_offer(v_offer);
    raise exception 'TEST FAILED: non-owner accept allowed';
  exception when others then
    if sqlerrm not like '%listing owner%' then raise; end if;
  end;

  -- Alice accepts
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);

  -- Offer accepted
  select status into v_status from offers where id = v_offer;
  if v_status <> 'accepted' then raise exception 'offer status=%', v_status; end if;

  -- Listings flipped to in_trade
  select status into v_listing_status from listings where id = v_camera;
  if v_listing_status <> 'in_trade' then raise exception 'camera=%', v_listing_status; end if;
  select status into v_listing_status from listings where id = v_bike;
  if v_listing_status <> 'in_trade' then raise exception 'bike=%', v_listing_status; end if;

  -- Thread exists with pin
  select id into v_thread_id from threads
    where listing_id = v_camera and buyer_id = v_bob and pinned_offer_id = v_offer;
  if v_thread_id is null then raise exception 'thread/pin missing'; end if;

  -- Notification
  if not exists (
    select 1 from notifications where user_id = v_bob and type = 'trade_offer_accepted'
  ) then raise exception 'notification missing'; end if;

  raise notice 'PASS: accept_offer basic';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_accept_offer_basic.sql
```

Expected: `NOTICE:  PASS: accept_offer basic`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_accept_offer_basic.sql
git commit -m "feat(trade-offers): implement accept_offer basic flow with thread + pin"
```

---

## Task 15: Add listing-wide auto-pass to `accept_offer()`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_accept_offer_listing_wide_autopass.sql`

- [ ] **Step 1: Replace `accept_offer()` with listing-wide auto-pass added**

Open `supabase/migrations/015_trade_offers.sql` and find the `accept_offer` function block. Replace it with:

```sql
-- ============================================================
-- accept_offer — adds listing-wide auto-pass
-- ============================================================

create or replace function accept_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_offer      offers%rowtype;
  v_owner      uuid;
  v_thread_id  uuid;
  v_sibling    uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_offer from offers where id = p_offer_id for update;
  if v_offer.id is null then raise exception 'Offer not found'; end if;
  if v_offer.status <> 'pending' then
    raise exception 'Offer is not pending (status=%)', v_offer.status;
  end if;

  select user_id into v_owner from listings where id = v_offer.listing_id;
  if v_owner <> v_caller then
    raise exception 'Only the listing owner can accept';
  end if;

  update offers set status = 'accepted' where id = v_offer.id;

  -- Listing-wide auto-pass: every other pending offer on this listing
  -- (covers both cash and trade offers)
  for v_sibling in
    select id from offers
    where listing_id = v_offer.listing_id
      and id <> v_offer.id
      and status = 'pending'
  loop
    update offers set status = 'auto_passed_listing' where id = v_sibling;
    insert into notifications (user_id, type, title, body, link)
      select buyer_id, 'trade_offer_auto_passed',
             'Listing already traded',
             'Your offer was auto-passed because the listing was traded.',
             '/listings/' || v_offer.listing_id
      from offers where id = v_sibling;
  end loop;

  -- Flip listings to in_trade
  update listings set status = 'in_trade' where id = v_offer.listing_id;
  update listings set status = 'in_trade'
    where id in (select listing_id from offer_items where offer_id = v_offer.id);

  -- Thread + pin
  insert into threads (listing_id, buyer_id, seller_id, listing_title, pinned_offer_id)
    values (v_offer.listing_id, v_offer.buyer_id, v_owner,
            (select title from listings where id = v_offer.listing_id),
            v_offer.id)
    on conflict (listing_id, buyer_id) do update
      set pinned_offer_id = excluded.pinned_offer_id
    returning id into v_thread_id;

  -- Notify buyer
  insert into notifications (user_id, type, title, body, link)
  values (v_offer.buyer_id, 'trade_offer_accepted',
          'Offer accepted!',
          'Your trade offer was accepted. Open the chat to coordinate.',
          '/threads/' || v_thread_id);
end;
$$;
```

Use your editor to do this replacement (Edit tool). Then:

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the listing-wide auto-pass test**

```bash
cat > supabase/tests/database/test_accept_offer_listing_wide_autopass.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid; v_charlie uuid;
  v_camera uuid;
  v_bike uuid; v_lens uuid;
  v_offer_bob uuid; v_offer_charlie uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_charlie := _test_create_user('charlie');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_lens   := _test_create_listing(v_charlie, 'Lens');

  -- Two offers on the same listing
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_bob := create_trade_offer(v_camera, array[v_bike], '');
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_offer_charlie := create_trade_offer(v_camera, array[v_lens], '');

  -- Alice accepts Bob's
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer_bob);

  -- Charlie's should be auto_passed_listing
  select status into v_status from offers where id = v_offer_charlie;
  if v_status <> 'auto_passed_listing' then
    raise exception 'expected auto_passed_listing, got %', v_status;
  end if;

  -- Charlie should have a notification
  if not exists (
    select 1 from notifications
    where user_id = v_charlie and type = 'trade_offer_auto_passed'
  ) then raise exception 'auto-pass notification missing'; end if;

  raise notice 'PASS: accept_offer listing-wide auto-pass';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_accept_offer_listing_wide_autopass.sql
```

Expected: `NOTICE:  PASS: accept_offer listing-wide auto-pass`

- [ ] **Step 5: Re-run Task 14's basic test to confirm no regression**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_accept_offer_basic.sql
```

Expected: `NOTICE:  PASS: accept_offer basic`

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_accept_offer_listing_wide_autopass.sql
git commit -m "feat(trade-offers): listing-wide auto-pass on accept"
```

---

## Task 16: Add item-overlap auto-pass to `accept_offer()`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_accept_offer_item_overlap_autopass.sql`

- [ ] **Step 1: Update `accept_offer()` to add item-overlap auto-pass**

In `supabase/migrations/015_trade_offers.sql`, find the listing-wide auto-pass loop you just added and insert a new block right after it. Replace this section:

```sql
  -- Listing-wide auto-pass: every other pending offer on this listing
  -- (covers both cash and trade offers)
  for v_sibling in
    select id from offers
    where listing_id = v_offer.listing_id
      and id <> v_offer.id
      and status = 'pending'
  loop
    update offers set status = 'auto_passed_listing' where id = v_sibling;
    insert into notifications (user_id, type, title, body, link)
      select buyer_id, 'trade_offer_auto_passed',
             'Listing already traded',
             'Your offer was auto-passed because the listing was traded.',
             '/listings/' || v_offer.listing_id
      from offers where id = v_sibling;
  end loop;
```

with this expanded version:

```sql
  -- Listing-wide auto-pass: every other pending offer on this listing
  for v_sibling in
    select id from offers
    where listing_id = v_offer.listing_id
      and id <> v_offer.id
      and status = 'pending'
  loop
    update offers set status = 'auto_passed_listing' where id = v_sibling;
    insert into notifications (user_id, type, title, body, link)
      select buyer_id, 'trade_offer_auto_passed',
             'Listing already traded',
             'Your offer was auto-passed because the listing was traded.',
             '/listings/' || v_offer.listing_id
      from offers where id = v_sibling;
  end loop;

  -- Item-overlap auto-pass: any other pending offer that includes one of
  -- the items just committed (the buyer can't fulfill duplicate offers).
  for v_sibling in
    select distinct o.id from offers o
    join offer_items oi on oi.offer_id = o.id
    where o.status = 'pending'
      and o.id <> v_offer.id
      and oi.listing_id in (
        select listing_id from offer_items where offer_id = v_offer.id
      )
  loop
    update offers set status = 'auto_passed_item_taken' where id = v_sibling;
    insert into notifications (user_id, type, title, body, link)
      select buyer_id, 'trade_offer_auto_passed',
             'Item already traded',
             'Your offer was auto-passed because an item was traded elsewhere.',
             '/trades/' || v_sibling
      from offers where id = v_sibling;
  end loop;
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the item-overlap test**

```bash
cat > supabase/tests/database/test_accept_offer_item_overlap_autopass.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_dave uuid; v_bob uuid;
  v_camera uuid; v_phone uuid;
  v_bike uuid;
  v_offer_to_alice uuid; v_offer_to_dave uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_dave  := _test_create_user('dave');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_phone  := _test_create_listing(v_dave, 'Phone');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  -- Bob offers his bike to BOTH Alice and Dave
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer_to_alice := create_trade_offer(v_camera, array[v_bike], '');
  v_offer_to_dave  := create_trade_offer(v_phone,  array[v_bike], '');

  -- Alice accepts
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer_to_alice);

  -- The Dave-side offer should be auto_passed_item_taken
  select status into v_status from offers where id = v_offer_to_dave;
  if v_status <> 'auto_passed_item_taken' then
    raise exception 'expected auto_passed_item_taken, got %', v_status;
  end if;

  raise notice 'PASS: accept_offer item-overlap auto-pass';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_accept_offer_item_overlap_autopass.sql
```

Expected: `NOTICE:  PASS: accept_offer item-overlap auto-pass`

- [ ] **Step 5: Re-run Tasks 14 + 15 tests for regression**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_accept_offer_basic.sql
psql "$LOCAL_DB" -f supabase/tests/database/test_accept_offer_listing_wide_autopass.sql
```

Both expected: PASS notices.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_accept_offer_item_overlap_autopass.sql
git commit -m "feat(trade-offers): item-overlap auto-pass on accept"
```

---

## Task 17: Implement `mark_offer_complete()`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_mark_offer_complete.sql`

- [ ] **Step 1: Append function**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- mark_offer_complete — both-sides handshake.
-- Buyer or seller calls; second caller flips status to completed
-- and the involved listings flip from in_trade to sold.
-- ============================================================

create or replace function mark_offer_complete(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_offer     offers%rowtype;
  v_owner     uuid;
  v_is_buyer  boolean;
  v_is_seller boolean;
  v_now_done  boolean;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_offer from offers where id = p_offer_id for update;
  if v_offer.id is null then raise exception 'Offer not found'; end if;
  if v_offer.status <> 'accepted' then
    raise exception 'Offer is not in accepted state (status=%)', v_offer.status;
  end if;

  select user_id into v_owner from listings where id = v_offer.listing_id;
  v_is_buyer  := (v_caller = v_offer.buyer_id);
  v_is_seller := (v_caller = v_owner);
  if not (v_is_buyer or v_is_seller) then
    raise exception 'Only trade participants can mark complete';
  end if;

  if v_is_buyer  then update offers set completed_by_buyer  = true where id = v_offer.id; end if;
  if v_is_seller then update offers set completed_by_seller = true where id = v_offer.id; end if;

  select (completed_by_buyer and completed_by_seller) into v_now_done
    from offers where id = v_offer.id;

  if v_now_done then
    update offers set status = 'completed' where id = v_offer.id;
    -- Flip listings: in_trade -> sold
    update listings set status = 'sold' where id = v_offer.listing_id;
    update listings set status = 'sold'
      where id in (select listing_id from offer_items where offer_id = v_offer.id);

    -- Notify both
    insert into notifications (user_id, type, title, body, link)
      values (v_offer.buyer_id, 'trade_offer_completed',
              'Trade complete',
              'Trade marked complete — leave a review.',
              '/reviews/new?trade=' || v_offer.id),
             (v_owner, 'trade_offer_completed',
              'Trade complete',
              'Trade marked complete — leave a review.',
              '/reviews/new?trade=' || v_offer.id);
  end if;
end;
$$;
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the test**

```bash
cat > supabase/tests/database/test_mark_offer_complete.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
  v_status text;
  v_listing_status text;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);

  -- Only buyer marks first
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform mark_offer_complete(v_offer);
  select status into v_status from offers where id = v_offer;
  if v_status <> 'accepted' then raise exception 'should still be accepted: %', v_status; end if;

  -- Now seller — flips to completed
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform mark_offer_complete(v_offer);
  select status into v_status from offers where id = v_offer;
  if v_status <> 'completed' then raise exception 'expected completed: %', v_status; end if;

  -- Listings should be sold
  select status into v_listing_status from listings where id = v_camera;
  if v_listing_status <> 'sold' then raise exception 'camera=%', v_listing_status; end if;
  select status into v_listing_status from listings where id = v_bike;
  if v_listing_status <> 'sold' then raise exception 'bike=%', v_listing_status; end if;

  -- Both should have completed notifications
  if (select count(*) from notifications where type = 'trade_offer_completed') <> 2 then
    raise exception 'completed notifications missing';
  end if;

  raise notice 'PASS: mark_offer_complete';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_mark_offer_complete.sql
```

Expected: `NOTICE:  PASS: mark_offer_complete`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_mark_offer_complete.sql
git commit -m "feat(trade-offers): implement mark_offer_complete handshake"
```

---

## Task 18: Trigger — auto-pass pending offers when listing becomes `sold` or `expired`

**Files:**
- Modify: `supabase/migrations/015_trade_offers.sql`
- Create: `supabase/tests/database/test_listing_status_trigger.sql`

This handles spec § 13 row 2: listing expires/sold mid-pending → auto-pass.

- [ ] **Step 1: Append trigger function**

```bash
cat >> supabase/migrations/015_trade_offers.sql << 'EOF'

-- ============================================================
-- Trigger: when a listing leaves 'active' for 'sold' or 'expired',
-- auto-pass pending offers that involve it (either as the offered listing
-- or as one of the offered items).
-- ============================================================

create or replace function listing_status_auto_pass()
returns trigger as $$
declare
  v_offer_id uuid;
begin
  if new.status not in ('sold', 'expired') then return new; end if;
  if old.status = new.status then return new; end if;

  -- Pending offers ON this listing
  for v_offer_id in
    select id from offers where listing_id = new.id and status = 'pending'
  loop
    update offers set status = 'auto_passed_listing' where id = v_offer_id;
    insert into notifications (user_id, type, title, body, link)
      select buyer_id, 'trade_offer_auto_passed',
             'Listing no longer available',
             'Your offer was auto-passed because the listing is no longer active.',
             '/listings/' || new.id
      from offers where id = v_offer_id;
  end loop;

  -- Pending offers that include this listing as an item
  for v_offer_id in
    select distinct o.id from offers o
    join offer_items oi on oi.offer_id = o.id
    where oi.listing_id = new.id and o.status = 'pending'
  loop
    update offers set status = 'auto_passed_item_taken' where id = v_offer_id;
    insert into notifications (user_id, type, title, body, link)
      select buyer_id, 'trade_offer_auto_passed',
             'Offered item no longer available',
             'Your offer was auto-passed because an offered item is no longer active.',
             '/trades/' || v_offer_id
      from offers where id = v_offer_id;
  end loop;

  return new;
end;
$$ language plpgsql;

create trigger listings_status_auto_pass
  after update of status on listings
  for each row execute function listing_status_auto_pass();
EOF
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write the test**

```bash
cat > supabase/tests/database/test_listing_status_trigger.sql << 'EOF'
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

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');

  -- Alice marks the camera as expired
  update listings set status = 'expired' where id = v_camera;

  select status into v_status from offers where id = v_offer;
  if v_status <> 'auto_passed_listing' then
    raise exception 'expected auto_passed_listing, got %', v_status;
  end if;

  raise notice 'PASS: listing status trigger auto-pass';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 4: Run the test**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_listing_status_trigger.sql
```

Expected: `NOTICE:  PASS: listing status trigger auto-pass`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/015_trade_offers.sql supabase/tests/database/test_listing_status_trigger.sql
git commit -m "feat(trade-offers): trigger auto-pass on listing status change"
```

---

## Task 19: RLS smoke test — anonymous read of trade offers

**Files:**
- Create: `supabase/tests/database/test_rls_anonymous_read.sql`

Confirms § 8.6 of spec: anonymous (anon role) can read trade offers + offer_items, but cannot insert.

- [ ] **Step 1: Write the test**

```bash
cat > supabase/tests/database/test_rls_anonymous_read.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid;
  v_offer uuid;
  v_count int;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');

  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike], '');
end $$;

-- Switch to anon role and try to read
set role anon;
select count(*) as offer_count from offers where status = 'pending' \gset
\if :offer_count
  \echo 'PASS: anon can read trade offers'
\else
  \echo 'FAIL: anon could not read trade offers'
  \q 1
\endif

-- Anon insert should fail
do $$
begin
  begin
    insert into offers (listing_id, buyer_id, proposer_id, offer_type)
    values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'trade');
    raise exception 'TEST FAILED: anon insert allowed';
  exception when insufficient_privilege or others then
    if sqlerrm like '%TEST FAILED%' then raise; end if;
    raise notice 'PASS: anon insert blocked (%)', sqlerrm;
  end;
end $$;

reset role;
do $$ begin perform _test_cleanup(); end $$;
EOF
```

- [ ] **Step 2: Run the test**

```bash
supabase db reset
psql "$LOCAL_DB" -f supabase/tests/database/test_rls_anonymous_read.sql
```

Expected output contains both:
- `PASS: anon can read trade offers`
- `PASS: anon insert blocked`

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/database/test_rls_anonymous_read.sql
git commit -m "test(trade-offers): verify anonymous read of trade offers + insert blocked"
```

---

## Task 20: End-to-end happy path scenario

**Files:**
- Create: `supabase/tests/database/test_e2e_happy_path.sql`

- [ ] **Step 1: Write the scenario**

```bash
cat > supabase/tests/database/test_e2e_happy_path.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_bob uuid;
  v_camera uuid; v_bike uuid; v_helmet uuid;
  v_offer uuid;
  v_thread_id uuid;
begin
  perform _test_cleanup();
  v_alice := _test_create_user('alice');
  v_bob   := _test_create_user('bob');
  v_camera := _test_create_listing(v_alice, 'Camera');
  v_bike   := _test_create_listing(v_bob, 'Bike');
  v_helmet := _test_create_listing(v_bob, 'Helmet');

  -- 1. Bob sends offer
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  v_offer := create_trade_offer(v_camera, array[v_bike, v_helmet], 'fair?');

  -- 2. Alice accepts
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_offer);

  -- 3. Both Mark Complete
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  perform mark_offer_complete(v_offer);
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform mark_offer_complete(v_offer);

  -- Final state assertions
  if (select status from offers where id = v_offer) <> 'completed' then
    raise exception 'offer not completed';
  end if;
  if (select status from listings where id = v_camera) <> 'sold' then
    raise exception 'camera not sold';
  end if;
  if (select status from listings where id = v_bike) <> 'sold' then
    raise exception 'bike not sold';
  end if;
  if (select status from listings where id = v_helmet) <> 'sold' then
    raise exception 'helmet not sold';
  end if;
  select id into v_thread_id from threads
    where listing_id = v_camera and buyer_id = v_bob and pinned_offer_id = v_offer;
  if v_thread_id is null then raise exception 'thread missing'; end if;

  -- Notifications: trade_offer_received, trade_offer_accepted, 2x trade_offer_completed
  if (select count(*) from notifications) < 4 then
    raise exception 'expected 4+ notifications';
  end if;

  raise notice 'PASS: e2e happy path';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 2: Run the scenario**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_e2e_happy_path.sql
```

Expected: `NOTICE:  PASS: e2e happy path`

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/database/test_e2e_happy_path.sql
git commit -m "test(trade-offers): e2e happy path scenario"
```

---

## Task 21: End-to-end counter chain (3 links)

**Files:**
- Create: `supabase/tests/database/test_e2e_counter_chain.sql`

- [ ] **Step 1: Write the scenario**

```bash
cat > supabase/tests/database/test_e2e_counter_chain.sql << 'EOF'
\i supabase/tests/database/_helpers.sql
do $$
declare
  v_alice uuid; v_charlie uuid;
  v_camera uuid; v_lens uuid; v_tripod uuid; v_glasses uuid;
  v_o1 uuid; v_o2 uuid; v_o3 uuid;
  v_status text;
begin
  perform _test_cleanup();
  v_alice   := _test_create_user('alice');
  v_charlie := _test_create_user('charlie');
  v_camera  := _test_create_listing(v_alice, 'Camera');
  v_lens    := _test_create_listing(v_charlie, 'Lens');
  v_tripod  := _test_create_listing(v_charlie, 'Tripod');
  v_glasses := _test_create_listing(v_charlie, 'Sunglasses');

  -- Charlie's original offer: lens + tripod
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_o1 := create_trade_offer(v_camera, array[v_lens, v_tripod], '');

  -- Alice counters: + sunglasses
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  v_o2 := counter_offer(v_o1, array[v_lens, v_tripod, v_glasses], 'add glasses');

  -- Charlie counters back: just lens + tripod (no glasses)
  perform set_config('request.jwt.claim.sub', v_charlie::text, true);
  v_o3 := counter_offer(v_o2, array[v_lens, v_tripod], 'best i can do');

  -- Alice accepts
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  perform accept_offer(v_o3);

  -- Verify chain
  select status into v_status from offers where id = v_o1;
  if v_status <> 'countered' then raise exception 'o1=%', v_status; end if;
  select status into v_status from offers where id = v_o2;
  if v_status <> 'countered' then raise exception 'o2=%', v_status; end if;
  select status into v_status from offers where id = v_o3;
  if v_status <> 'accepted' then raise exception 'o3=%', v_status; end if;

  -- Listings flipped to in_trade (only the items in the accepted link + the camera)
  if (select status from listings where id = v_camera) <> 'in_trade' then
    raise exception 'camera not in_trade';
  end if;
  if (select status from listings where id = v_lens) <> 'in_trade' then
    raise exception 'lens not in_trade';
  end if;
  if (select status from listings where id = v_glasses) <> 'active' then
    raise exception 'glasses should still be active (not in accepted link)';
  end if;

  raise notice 'PASS: e2e counter chain';
  perform _test_cleanup();
end $$;
EOF
```

- [ ] **Step 2: Run the scenario**

```bash
psql "$LOCAL_DB" -f supabase/tests/database/test_e2e_counter_chain.sql
```

Expected: `NOTICE:  PASS: e2e counter chain`

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/database/test_e2e_counter_chain.sql
git commit -m "test(trade-offers): e2e counter chain (3 links) ending in accept"
```

---

## Task 22: Final smoke — run every test fresh

**Files:**
- (none — script-only verification)

- [ ] **Step 1: Reset DB and run all tests in order**

```bash
supabase db reset
for f in supabase/tests/database/test_*.sql; do
  echo "=== $f ==="
  psql "$LOCAL_DB" -f "$f" || { echo "FAIL: $f"; exit 1; }
done
echo "ALL TESTS PASSED"
```

Expected: ends with `ALL TESTS PASSED`. Each test should print its PASS notice.

- [ ] **Step 2: Verify all 6 stored functions exist**

```bash
psql "$LOCAL_DB" -c "
select proname from pg_proc
where proname in (
  'create_trade_offer', 'pass_offer', 'withdraw_offer',
  'counter_offer', 'accept_offer', 'mark_offer_complete'
)
order by proname;"
```

Expected: 6 rows, one per function.

- [ ] **Step 3: Verify schema invariants**

```bash
psql "$LOCAL_DB" -c "
select
  (select count(*) from information_schema.columns
    where table_name = 'offers' and column_name in
      ('offer_type', 'proposer_id', 'parent_offer_id', 'updated_at',
       'completed_by_buyer', 'completed_by_seller')) as new_offer_cols,
  (select count(*) from information_schema.tables
    where table_name = 'offer_items') as offer_items_table,
  (select count(*) from information_schema.columns
    where table_name = 'threads' and column_name = 'pinned_offer_id') as pin_col;"
```

Expected: `new_offer_cols=6, offer_items_table=1, pin_col=1`.

- [ ] **Step 4: Confirm no merge issues with the rest of the migrations**

```bash
ls supabase/migrations/
```

Expected: shows `015_trade_offers.sql` alongside `001_*.sql` through `014_*.sql`.

- [ ] **Step 5: Final commit (if anything new)**

```bash
git status
# If working tree is clean, you're done. Otherwise:
# git add . && git commit -m "chore(trade-offers): final smoke pass"
```

---

## 🔴 Pre-deploy blocker (must resolve BEFORE any remote push or deploy)

**Issue surfaced during Task 8 review.** Task 8 drops the existing `"Offer participants can update offers"` RLS policy and intentionally does NOT replace it — all `offers` UPDATEs are designed to flow through SECURITY DEFINER stored functions (Tasks 10–17).

However, **`app/(main)/offers/page.tsx` still does a direct client UPDATE** at lines 102–114 inside `handleUpdateOffer()`:

```ts
const { error } = await supabase
  .from("offers")
  .update({ status: newStatus })   // ← needs UPDATE policy
  .eq("id", offerId);
```

This is the existing cash-offer Accept/Decline flow. The dropped policy was permitting it. After Plan 1 ships and this migration is applied to a live database, that flow breaks immediately — listing owners clicking Accept/Decline see `toast.error("Failed to update offer")` and nothing changes.

**Local development is NOT affected** — the breakage only manifests when the migration runs against a database that has the production Next.js app calling `.update()`.

**Resolution (must happen in Plan 2, before deploying Plan 1's migration):**

Replace the direct UPDATE in `app/(main)/offers/page.tsx` with a server action that calls the relevant stored function (`accept_offer()` for "accepted", `pass_offer()` for "declined"). The cash-offer flow then routes through the same SECURITY DEFINER security model as trade offers.

Until that migration of the cash flow is done:
- ❌ Do NOT push this branch to remote.
- ❌ Do NOT apply migration `015_trade_offers.sql` to the staging or production Supabase project.
- ❌ Do NOT merge to `main` if `main` is auto-deployed.

This blocker is intentionally documented prominently here so it is impossible to miss during the deploy review.

---

## 🟡 Pre-deploy debt (track and resolve before remote push)

These do not break local development but must be addressed before this migration runs against a live database.

### Debt 1: `accept_offer()` notification batching not implemented

Spec §8.7 requires: *"when `accept_offer()` auto-passes 3+ offers, batch into a single `trade_offer_auto_passed` notification per affected user with a count, not one per offer."*

Current behavior (Tasks 14–16): the listing-wide auto-pass loop and the item-overlap auto-pass loop each `insert into notifications` once per sibling offer. A buyer with multiple pending offers on the same listing will receive multiple `trade_offer_auto_passed` rows.

- **Severity:** Important. Not a correctness bug — every notification points to a real auto-pass — but it produces a noisy inbox in the rare multi-offer case.
- **Resolution:** implement aggregation in a follow-up task (candidate: Task 16.5) before remote push. Likely shape: collect `(buyer_id, reason, listing_id)` tuples in a temp set during the loops; after both loops finish, emit one notification per `(buyer_id, reason)` group with a count in the body when count ≥ 3.
- **Until resolved:** ❌ do not push this branch to remote, ❌ do not deploy the migration to staging or prod.

### Debt 2: concurrent `accept_offer()` deadlock handling not surfaced to caller

`accept_offer()` takes `for update` on the accepted offer's row, then updates sibling offers via the listing-wide loop. Two callers accepting *different* pending offers on the *same* listing each lock their own row first, then each tries to update the other's row inside the listing-wide loop → **classic two-row deadlock**.

- **Severity:** Important. PostgreSQL's deadlock detector aborts one of the two transactions cleanly, so there is no data corruption — but the losing caller currently surfaces a raw `deadlock detected` SQL error to the UI.
- **Resolution (server/UI layer, not the SQL function):** in the Next.js server action that calls `accept_offer()`, catch Postgres error code `40P01` and either (a) retry once after a small jitter, or (b) return a friendly "Another acceptance was processed first — please refresh" error. Do not retry blindly more than once.
- **Stress-test before deploy:** add a parallel-accept scenario to the integration test pass (two concurrent `psql` sessions calling `accept_offer()` on different pending offers of the same listing) and confirm the loser gets `40P01` and the winner's transaction commits cleanly.
- **Until resolved:** ❌ do not push this branch to remote, ❌ do not deploy the migration to staging or prod.

---

## Done — Plan 1 of 5 ships

After this plan: the entire DB layer for Trade Offers is live, atomic, RLS-protected, and tested. No UI yet — that's Plan 2.

**What's working:**
- Migration `015_trade_offers.sql` applies cleanly via `supabase db reset`
- 6 stored functions atomically handle all offer state transitions
- Listing status auto-flips to `in_trade` on accept and `sold` on completion
- Auto-pass for listing-wide and item-overlap conflicts
- Trigger handles listing → sold/expired auto-pass
- Anonymous users can read trade offers (per § 8.6 of spec)
- 13 SQL test scripts (12 named + the helpers) covering happy path, counter chains, auto-pass scenarios, and RLS smoke

**Spec coverage check (sections of `2026-04-26-async-trade-offers-design.md`):**
- § 8.1 offers extension ✅ Task 3
- § 8.2 offer_items ✅ Task 4
- § 8.3 listings status ✅ Task 5
- § 8.4 threads.pinned_offer_id ✅ Task 6
- § 8.5 notifications types ✅ Task 7
- § 8.6 RLS ✅ Tasks 8, 9, 19
- § 8.7 stored functions ✅ Tasks 10–17
- § 13 row 2 (listing status trigger) ✅ Task 18
- E2E happy path + counter chain ✅ Tasks 20, 21

**Deferred to Plan 2 onward:**
- Server actions wrapping these functions
- UI components
- Notification batching/dedup logic (currently 1 notification per auto-pass — refactor in Plan 5)
- Rate limiting (Plan 5)
- Cross-cancel from cash-side accepts (currently `accept_offer` is trade-only; the cash-side path will be audited and wired in Plan 5 once the existing cash flow is mapped)
- Snapshot of offered items (deferred to v2 of feature)
