-- === POLICIES FOR 'notes' TABLE ===
-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
-- 1. Any authenticated user can view all notes.
CREATE POLICY "Allow authenticated users to view all notes"
ON public.notes FOR SELECT TO authenticated USING (true);
-- 2. Any authenticated user can upload a new note.
CREATE POLICY "Allow authenticated users to insert notes"
ON public.notes FOR INSERT TO authenticated WITH CHECK (true);
-- 3. Users can ONLY delete notes they have personally uploaded.
CREATE POLICY "Allow users to delete their own notes"
ON public.notes FOR DELETE TO authenticated
USING ( uploader_id = public.requesting_user_id() );
-- 4. Super Admins can delete any note for moderation.
CREATE POLICY "Allow super admins to delete any note"
ON public.notes FOR DELETE TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );
-- === POLICIES FOR 'notes' STORAGE BUCKET ===
-- We will apply these manually in the Supabase Dashboard UI for simplicity.
-- The policies ensure users can only upload/manage files within their own user-id folder.