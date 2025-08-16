-- This policy grants Super Admins the ability to view all records in the profiles table.
-- This is necessary for features like the user management dropdown.
-- It is additive to the existing policy that allows users to see their own profile.
CREATE POLICY "Allow super admins to view all user profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE user_id = public.requesting_user_id()) = 'super_admin' );