
-- Create a table to store VAPID subscription objects
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  keys jsonb not null, -- Stores { p256dh, auth }
  created_at timestamp with time zone default now(),
  unique(user_id, endpoint) -- Prevent duplicate subscriptions for same device
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies
create policy "Users can upload their own subscriptions" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can delete their own subscriptions" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
  
-- Admin Policy (for the backend service role to access all)
-- Note: Service Role bypasses RLS, so this is mainly for clarity or specific admin users
create policy "Admins can view all" on public.push_subscriptions
  for select using (auth.jwt() ->> 'email' = 'arihant@orbit.local');
