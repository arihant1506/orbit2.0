
-- ==============================================================================
-- ORBIT ROUTINE TRACKER - SUPABASE SETUP SCRIPT
-- Copy this entire script into the Supabase SQL Editor and click "Run".
-- ==============================================================================

-- 1. Create the user_profiles table (if not exists)
create table if not exists public.user_profiles (
  id uuid not null primary key,
  username text,
  profile_data jsonb,
  last_synced timestamp with time zone default now()
);

-- 2. CRITICAL: Enforce Cascade Delete on Foreign Key
--    This ensures that when a user is deleted from auth.users, their profile is AUTOMATICALLY deleted.
--    We drop and recreate the constraint to guarantee it is set up correctly.
alter table public.user_profiles 
  drop constraint if exists user_profiles_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_id_fkey 
  foreign key (id) 
  references auth.users(id) 
  on delete cascade;

-- 3. Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- 4. Define Access Policies
drop policy if exists "Users can manage own profile" on public.user_profiles;
create policy "Users can manage own profile"
  on public.user_profiles
  for all
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Admin Policies (for 'arihant')
drop policy if exists "Admin can view all profiles" on public.user_profiles;
create policy "Admin can view all profiles"
  on public.user_profiles
  for select
  using ( auth.jwt() ->> 'email' = 'arihant@orbit.local' );

drop policy if exists "Admin can delete profiles" on public.user_profiles;
create policy "Admin can delete profiles"
  on public.user_profiles
  for delete
  using ( auth.jwt() ->> 'email' = 'arihant@orbit.local' );

-- 5. Secure Function for Permanent Account Deletion
--    We drop first to avoid any signature conflicts from previous versions.
drop function if exists delete_user_account;

create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = public -- Good security practice
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  -- Safety check
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete from auth.users. 
  -- Thanks to the ON DELETE CASCADE constraint added above, 
  -- this will automatically clean up the user_profiles table too.
  delete from auth.users where id = current_user_id;
end;
$$;

-- Grant permission to authenticated users
grant execute on function delete_user_account() to authenticated;

-- 6. Setup Storage for Avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );
