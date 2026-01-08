-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
-- Extends the built-in auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  bio text,
  message_count int default 0,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

-- AUDIT_LOGS TABLE
-- Track security events and user actions
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Create index for faster audit log queries
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_event_type on public.audit_logs(event_type);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- SESSIONS TABLE
-- Manage active user sessions
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_info text,
  ip_address inet,
  last_activity timestamptz default now(),
  created_at timestamptz default now()
);

-- Create index for faster session queries
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_last_activity on public.sessions(last_activity desc);

-- RLS POLICIES (Row Level Security)
alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sessions enable row level security;

-- Profiles: Users can read their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Profiles: Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Chats: Users can read their own chats
create policy "Users can view own chats" on public.chats
  for select using (auth.uid() = user_id);

-- Audit Logs: Users can read their own audit logs
create policy "Users can view own audit logs" on public.audit_logs
  for select using (auth.uid() = user_id);

-- Sessions: Users can read their own sessions
create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);

-- Sessions: Users can delete their own sessions
create policy "Users can delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);

-- FUNCTION: Handle New User
-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, last_login)
  values (new.id, new.raw_user_meta_data->>'full_name', now());
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: Trigger the function on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- FUNCTION: Update last login timestamp
create or replace function public.update_last_login()
returns trigger as $$
begin
  update public.profiles
  set last_login = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: Update last login on successful auth
create trigger on_auth_user_login
  after update on auth.users
  for each row
  when (old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute procedure public.update_last_login();

