-- Community posts & comments for user profile Community tab

create table community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_community_posts_user on community_posts(user_id);
create index idx_community_posts_created on community_posts(created_at desc);
create index idx_community_comments_post on community_comments(post_id);

-- RLS
alter table community_posts enable row level security;
alter table community_comments enable row level security;

create policy "Community posts are publicly readable"
  on community_posts for select using (true);

create policy "Authenticated users can create community posts"
  on community_posts for insert with check (auth.uid() = user_id);

create policy "Users can update own community posts"
  on community_posts for update using (auth.uid() = user_id);

create policy "Users can delete own community posts"
  on community_posts for delete using (auth.uid() = user_id);

create policy "Community comments are publicly readable"
  on community_comments for select using (true);

create policy "Authenticated users can create community comments"
  on community_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own community comments"
  on community_comments for delete using (auth.uid() = user_id);
