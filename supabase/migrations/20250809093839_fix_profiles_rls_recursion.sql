-- 1. DROP the old, recursive policy for super admins to avoid conflicts.
DROP POLICY IF EXISTS "Allow super admins to view all user profiles" ON public.profiles;

-- 2. DROP the old policy for individual users to replace it with a more robust version.
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles; -- Old name

-- 3. CREATE a new, correct policy for Super Admin access.
--    This policy reads the 'user_role' directly from the JWT, avoiding recursion.
CREATE POLICY "Allow super admins to view all user profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING ( (current_setting('request.jwt.claims', true)::jsonb->>'user_role') = 'super_admin' );


-- 4. CREATE a new, correct policy for individual user access.
--    This remains the primary way for a user to see their own profile.
CREATE POLICY "Allow individual users to view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( public.requesting_user_id() = user_id );