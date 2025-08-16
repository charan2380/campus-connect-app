-- Add a new column to store the student's name at the time of registration.
ALTER TABLE public.event_registrations
ADD COLUMN student_name TEXT;