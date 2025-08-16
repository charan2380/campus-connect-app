-- 1. Drop the GIN index that was created for the full-text search.
--    It's good practice to drop the index before dropping the column it depends on.
DROP INDEX IF EXISTS public.notes_fts;

-- 2. Drop the 'fts' tsvector column from the notes table.
--    This completely removes the full-text search functionality from the database schema.
ALTER TABLE public.notes
DROP COLUMN IF EXISTS fts;