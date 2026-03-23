-- Reviews table for Kravings brand-safe rating system
-- Run this in your Supabase SQL Editor

-- Create reviews table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade unique,
  rating int not null check (rating >= 1 and rating <= 5),
  review_text text,
  user_name text,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table reviews enable row level security;

-- Policy: Users can insert their own review
create policy "Users can insert own review"
  on reviews for insert
  with check (auth.uid() = user_id);

-- Policy: Anyone can read public reviews (for landing page)
create policy "Anyone can read public reviews"
  on reviews for select
  using (is_public = true);

-- Policy: Users can read their own reviews (any rating)
create policy "Users can read own reviews"
  on reviews for select
  using (auth.uid() = user_id);

-- Policy: Admin can read all reviews
create policy "Admin can read all reviews"
  on reviews for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Index for fast lookups
create index if not exists idx_reviews_order_id on reviews(order_id);
create index if not exists idx_reviews_public on reviews(is_public) where is_public = true;
create index if not exists idx_reviews_user_id on reviews(user_id);

-- Enable realtime for admin dashboard
alter publication supabase_realtime add table reviews;
