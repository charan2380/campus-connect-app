-- This policy allows users to update their own records in the 'profiles' table.
-- Without this, all update attempts are denied by default.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
USING ( public.requesting_user_id() = user_id )
WITH CHECK ( public.requesting_user_id() = user_id );