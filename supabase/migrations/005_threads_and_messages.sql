-- supabase/migrations/004_threads_and_messages.sql

-- ============================================================
-- TABLES
-- ============================================================

create table threads (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete cascade,
  buyer_id        uuid not null references profiles(id) on delete cascade,
  seller_id       uuid not null references profiles(id) on delete cascade,
  listing_title   text not null default '',
  last_message    text not null default '',
  last_message_at timestamptz not null default now(),
  buyer_unread    integer not null default 0,
  seller_unread   integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references threads(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete cascade,
  body       text not null,
  is_read    boolean not null default false,
  sent_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_threads_buyer   on threads(buyer_id);
create index idx_threads_seller  on threads(seller_id);
create index idx_threads_listing on threads(listing_id);
create index idx_messages_thread on messages(thread_id, sent_at asc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table threads  enable row level security;
alter table messages enable row level security;

-- Threads: readable by buyer or seller
create policy "Thread participants can read threads"
  on threads for select using (
    auth.uid() = buyer_id or auth.uid() = seller_id
  );

create policy "Authenticated users can create threads"
  on threads for insert with check (auth.uid() = buyer_id);

create policy "Thread participants can update threads"
  on threads for update using (
    auth.uid() = buyer_id or auth.uid() = seller_id
  );

-- Messages: readable by thread participants
create policy "Thread participants can read messages"
  on messages for select using (
    auth.uid() in (
      select buyer_id  from threads where id = thread_id
      union
      select seller_id from threads where id = thread_id
    )
  );

create policy "Thread participants can send messages"
  on messages for insert with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select buyer_id  from threads where id = thread_id
      union
      select seller_id from threads where id = thread_id
    )
  );
