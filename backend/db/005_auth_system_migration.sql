-- Migration: Full Auth System Implementation
-- This migration updates the schema from anonymous auth to full email/password auth
-- Date: 2026-01-04

-- Step 1: Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS last_login timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Step 2: Remove is_guest column (after backing up if needed)
-- Note: This will remove anonymous user tracking
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS is_guest;

-- Step 3: Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Step 4: Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_info text,
  ip_address inet,
  last_activity timestamptz default now(),
  created_at timestamptz default now()
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at desc);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON public.sessions(last_activity desc);

-- Step 6: Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for audit_logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions" ON public.sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Step 9: Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, last_login)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create update_last_login function
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create trigger for updating last login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (old.last_sign_in_at IS DISTINCT FROM new.last_sign_in_at)
  EXECUTE PROCEDURE public.update_last_login();

-- Step 12: Clean up anonymous users (optional - comment out if you want to keep them)
-- DELETE FROM auth.users WHERE email IS NULL;
-- Note: The above line is commented out for safety. Uncomment if you want to remove anonymous users.

-- Step 13: Update existing profiles with default last_login
UPDATE public.profiles
SET last_login = created_at
WHERE last_login IS NULL;

-- Migration complete
-- Next steps:
-- 1. Configure Supabase Auth settings in dashboard
-- 2. Enable email/password authentication
-- 3. Configure email templates
-- 4. Set up OAuth providers (Google, GitHub)


