-- Create a new column 'fts' of type tsvector.
alter table public.notes
add column fts tsvector
generated always as (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) stored;

-- Create a GIN index on this new column. This makes searching incredibly fast.
create index notes_fts on public.notes using gin (fts);