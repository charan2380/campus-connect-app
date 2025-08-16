-- 1. DROP the old, recursive policy for HODs to avoid conflicts.
DROP POLICY IF EXISTS "Allow HODs to view student profiles" ON public.profiles;

-- 2. CREATE a new, correct, non-recursive policy for HOD access.
--    This policy reads the 'user_role' directly from the JWT.
CREATE POLICY "Allow HODs to view student profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- The person making the request must have the 'hod' role in their token.
  (current_setting('request.jwt.claims', true)::jsonb->>'user_role') = 'hod'
  AND
  -- The rows they are allowed to see must be students.
  role = 'student'
);