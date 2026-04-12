-- supabase/migrations/006_notifications.sql

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in ('offer_received', 'offer_accepted', 'offer_declined', 'offer_countered', 'new_message_thread', 'new_message', 'review_received')),
  icon        text not null default '',
  title       text not null,
  body        text not null default '',
  link        text not null default '',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_unread on notifications(user_id) where read = false;

alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Authenticated users can create notifications"
  on notifications for insert with check (true);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

alter publication supabase_realtime add table notifications;
