-- Add a new 'email' column to the public.profiles table.
ALTER TABLE public.profiles
ADD COLUMN email TEXT;