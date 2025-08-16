-- 1. Drop the old single-file column.
ALTER TABLE public.notes
DROP COLUMN file_url;

-- 2. Add a new column 'file_urls' with the data type of text array (TEXT[]).
--    This allows us to store multiple URLs in a single record.
ALTER TABLE public.notes
ADD COLUMN file_urls TEXT[];

-- 3. Add a new 'description' column for more context.
ALTER TABLE public.notes
ADD COLUMN description TEXT;