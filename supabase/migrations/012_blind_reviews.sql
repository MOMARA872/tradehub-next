-- Blind review system: both parties review independently.
-- Reviews are hidden until both submit, then auto-revealed.

create table blind_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  buyer_review jsonb,   -- { rating, comment, quickTags, conditionMatch, submittedAt }
  seller_review jsonb,  -- same shape
  status text not null default 'awaiting_both'
    check (status in ('awaiting_both', 'awaiting_buyer', 'awaiting_seller', 'revealed')),
  revealed_at timestamptz,
  created_at timestamptz not null default now(),

  -- One review record per listing+buyer+seller combo.
  unique (listing_id, buyer_id, seller_id)
);

create index idx_blind_reviews_buyer on blind_reviews(buyer_id);
create index idx_blind_reviews_seller on blind_reviews(seller_id);
create index idx_blind_reviews_listing on blind_reviews(listing_id);

-- RLS
alter table blind_reviews enable row level security;

-- Participants can read their own reviews.
create policy "Participants can read own reviews"
  on blind_reviews for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Participants can update (submit their review side).
create policy "Participants can submit own review"
  on blind_reviews for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Authenticated users can create review records (for completed transactions).
create policy "Authenticated users can create reviews"
  on blind_reviews for insert
  with check (auth.uid() is not null);

-- Auto-reveal trigger: when both reviews are submitted, set status + timestamp.
create or replace function auto_reveal_blind_review()
returns trigger as $$
begin
  if NEW.buyer_review is not null and NEW.seller_review is not null then
    NEW.status := 'revealed';
    NEW.revealed_at := now();
  elsif NEW.buyer_review is not null and NEW.seller_review is null then
    NEW.status := 'awaiting_seller';
  elsif NEW.buyer_review is null and NEW.seller_review is not null then
    NEW.status := 'awaiting_buyer';
  else
    NEW.status := 'awaiting_both';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_auto_reveal_blind_review
  before insert or update on blind_reviews
  for each row
  execute function auto_reveal_blind_review();
