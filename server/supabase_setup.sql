
-- ====================================================================
-- ORBIT MASTER DATABASE SETUP
-- Run this in the Supabase SQL Editor to configure:
-- 1. User Profiles (Data Persistence)
-- 2. Push Notifications (VAPID)
-- 3. Storage (Avatars)
-- 4. Account Security (RPC Deletion)
-- ====================================================================

-- --- 1. USER PROFILES (The Brain) ---
create table if not exists public.user_profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  username text,
  profile_data jsonb default '{}'::jsonb, -- Holds Schedule, Ticks, Water, Notes, Preferences
  last_synced timestamp with time zone default now()
);

alter table public.user_profiles enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = id);
create policy "Admin can view all" on public.user_profiles for select using (auth.jwt() ->> 'email' = 'arihant@orbit.local');

-- --- 2. PUSH SUBSCRIPTIONS (The Voice) ---
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamp with time zone default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id);

-- --- 3. ACCOUNT DELETION LOGIC (RPC) ---
create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function delete_user_account() to authenticated;

-- --- 4. STORAGE (Avatars) ---
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

create policy "Public Access to Avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users upload own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() = owner);
create policy "Users update own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid() = owner);
