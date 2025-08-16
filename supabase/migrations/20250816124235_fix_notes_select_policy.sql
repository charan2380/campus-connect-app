-- 1. DROP the old, incomplete SELECT policy.
DROP POLICY IF EXISTS "Allow authenticated users to view all notes" ON public.notes;

-- 2. CREATE the new, correct policy for SELECT operations.
--    This policy grants read access to all columns for any authenticated user.
CREATE POLICY "Allow authenticated users to view all notes"
ON public.notes
FOR SELECT
TO authenticated
USING (true);