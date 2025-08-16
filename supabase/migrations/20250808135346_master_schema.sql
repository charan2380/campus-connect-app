-- ========= Phase 1: Core Authentication Function =========

-- Creates a function that returns the user's ID from the JWT claims
-- This is the cornerstone of the RLS policy.
create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;


-- ========= Phase 2: Table Creation =========

-- Create a custom type for user roles to ensure data consistency.
create type public.user_role as enum ('student', 'hod', 'club_admin', 'super_admin');

-- Create the profiles table.
-- The user_id is the PRIMARY KEY and directly stores the Clerk user ID.
create table public.profiles (
  user_id text primary key,
  role user_role not null default 'student',
  full_name text,
  department text,
  year integer,
  contact_info text,
  bio text,
  avatar_url text,
  college_id_url text,
  bus_id_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Set the default user_id for new rows to the one from the JWT
alter table public.profiles alter column user_id set default public.requesting_user_id();

-- Create the lost_and_found_items table.
-- Foreign key now correctly points to profiles(user_id) of type text.
create table public.lost_and_found_items (
  id bigserial primary key,
  user_id text references public.profiles(user_id) on delete cascade not null,
  item_name text not null,
  description text,
  image_url text,
  status text not null check (status in ('lost', 'found')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the medication_requests table.
create table public.medication_requests (
  id bigserial primary key,
  student_id text references public.profiles(user_id) on delete cascade not null,
  hod_department text not null,
  medication_details text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the clubs table.
create table public.clubs (
    id bigserial primary key,
    club_name text not null unique,
    club_admin_id text references public.profiles(user_id) on delete set null
);

-- Create the club_posts table for events and announcements.
create table public.club_posts (
  id bigserial primary key,
  club_id bigint references public.clubs(id) on delete cascade not null,
  title text not null,
  description text not null,
  poster_image_url text,
  event_date timestamp with time zone,
  venue text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the event_registrations table.
create table public.event_registrations (
  id bigserial primary key,
  post_id bigint references public.club_posts(id) on delete cascade not null,
  student_id text references public.profiles(user_id) on delete cascade not null,
  roll_no text not null,
  department text not null,
  year integer not null,
  resume_url text,
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (post_id, student_id)
);

-- Create the room_rentals table.
create table public.room_rentals (
  id bigserial primary key,
  user_id text references public.profiles(user_id) on delete cascade not null,
  address text not null,
  contact_info text not null,
  photos_urls text[],
  is_verified boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the notes table.
create table public.notes (
  id bigserial primary key,
  uploader_id text references public.profiles(user_id) on delete cascade not null,
  title text not null,
  file_url text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the feedback table.
create table public.feedback (
  id bigserial primary key,
  submitter_id text references public.profiles(user_id) on delete set null,
  channel text not null check (channel in ('hod', 'club', 'super_admin')),
  target_id text,
  message text not null,
  is_anonymous boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the alerts table.
create table public.alerts (
  id bigserial primary key,
  creator_id text references public.profiles(user_id) on delete set null,
  message text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);