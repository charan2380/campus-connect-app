-- 1. Rename the existing 'medication_details' column to 'title' for clarity.
ALTER TABLE public.medication_requests
RENAME COLUMN medication_details TO title;

-- 2. Add a new 'description' column. This will be for the detailed symptoms.
ALTER TABLE public.medication_requests
ADD COLUMN description TEXT;

-- 3. Add a new optional 'location' column.
ALTER TABLE public.medication_requests
ADD COLUMN location TEXT;