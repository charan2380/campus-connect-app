-- This policy allows users with the 'hod' role to view all profiles that have the 'student' role.
-- It is additive to existing policies, so HODs can still see their own profile.
CREATE POLICY "Allow HODs to view student profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- The person making the request must be an HOD.
  (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'hod'
  AND
  -- The rows they are allowed to see must be students.
  role = 'student'
);