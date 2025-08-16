-- 1. DROP the old, separate policies to avoid conflicts.
DROP POLICY IF EXISTS "Allow users to delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Allow super admins to delete any note" ON public.notes;

-- 2. CREATE the new, single, correct policy for DELETE operations.
--    This allows deletion if the user is the original uploader OR if they are a Super Admin.
CREATE POLICY "Allow deletion of notes by owner or Super Admin"
ON public.notes
FOR DELETE
TO authenticated
USING (
  -- Condition 1: The user is the owner of the note.
  (uploader_id = public.requesting_user_id())
  OR
  -- Condition 2: The user's role in their JWT is 'super_admin'.
  ((current_setting('request.jwt.claims', true)::jsonb->>'user_role') = 'super_admin')
);