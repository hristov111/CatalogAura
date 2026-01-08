-- Migration: Add Personas (AI Models) Table and Storage
-- This stores AI character profiles like Elara, Seraphina, etc.

-- PERSONAS TABLE
create table public.personas (
  id serial primary key,
  name text not null unique,
  age int,
  city text,
  image_url text,
  interests text[] default '{}',
  bio text,
  extended_bio text,
  passions text[] default '{}',
  values text[] default '{}',
  gallery text[] default '{}',
  status text check (status in ('online', 'offline')) default 'online',
  availability text default 'Available for chat',
  personality_line text,
  testimonials text[] default '{}',
  special_offer text,
  response_time text,
  verified boolean default false,
  theme jsonb default '{}',
  system_prompt text, -- AI system prompt for chat personality
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index on name for faster lookups
create index idx_personas_name on public.personas(name);
create index idx_personas_status on public.personas(status);

-- Enable RLS
alter table public.personas enable row level security;

-- Personas are publicly readable (everyone can see AI profiles)
create policy "Personas are publicly readable" on public.personas
  for select using (true);

-- Only service role can manage personas (admin operations via backend)
-- No policy needed here as service role bypasses RLS

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_personas_updated_at
  before update on public.personas
  for each row
  execute function update_updated_at_column();

-- STORAGE BUCKET for persona images
-- This will store profile pictures and gallery images
insert into storage.buckets (id, name, public)
values ('persona-images', 'persona-images', true)
on conflict (id) do nothing;

-- Allow public read access to persona images
create policy "Public can view persona images"
  on storage.objects for select
  using (bucket_id = 'persona-images');

-- Only authenticated users (admins via service role) can upload
create policy "Authenticated users can upload persona images"
  on storage.objects for insert
  with check (bucket_id = 'persona-images' and auth.role() = 'authenticated');

-- Only authenticated users can update their uploads
create policy "Authenticated users can update persona images"
  on storage.objects for update
  using (bucket_id = 'persona-images' and auth.role() = 'authenticated');

-- Only authenticated users can delete
create policy "Authenticated users can delete persona images"
  on storage.objects for delete
  using (bucket_id = 'persona-images' and auth.role() = 'authenticated');

-- Add comment for documentation
comment on table public.personas is 'Stores AI character personas/models with their personality traits and appearance';
comment on column public.personas.system_prompt is 'System prompt used to configure AI behavior for this persona';
comment on column public.personas.theme is 'JSON object containing color theme configuration for UI';

