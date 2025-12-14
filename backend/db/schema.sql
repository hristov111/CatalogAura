-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
-- Extends the built-in auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  is_guest boolean default true,
  message_count int default 0,
  created_at timestamptz default now()
);

-- CHATS TABLE
-- Stores chat logs linked to profiles
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- RLS POLICIES (Row Level Security)
alter table public.profiles enable row level security;
alter table public.chats enable row level security;

-- Profiles: Users can read their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Profiles: Users can update their own profile (e.g. if we add fields later)
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Chats: Users can read their own chats
create policy "Users can view own chats" on public.chats
  for select using (auth.uid() = user_id);

-- Chats: Users can insert their own chats (if we allow direct insertion from frontend)
-- For this architecture, insertions mainly happen via backend, which uses Service Role (bypassing RLS)
-- But allowing read access is good for loading history.

-- FUNCTION: Handle New User
-- Automatically create a profile when a new user signs up (guest or real)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_guest)
  values (new.id, (new.email is null)); -- If email is null, it's an anonymous/guest user
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: Trigger the function on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

