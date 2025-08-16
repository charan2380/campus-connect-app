-- 1. DROP the old, more restrictive policy.
DROP POLICY IF EXISTS "Allow Club Admins to delete their own club posts" ON public.club_posts;

-- 2. CREATE the new, correct policy for DELETE operations.
--    This allows deletion by the responsible Club Admin OR any Super Admin.
CREATE POLICY "Allow deletion of posts by Club Admin or Super Admin"
ON public.club_posts
FOR DELETE
TO authenticated
USING (
  -- Condition 1: The user is the admin of the club that made the post.
  ( (SELECT club_admin_id FROM public.clubs WHERE id = club_id) = public.requesting_user_id() )
  OR
  -- Condition 2: The user's role in their JWT is 'super_admin'.
  ( (current_setting('request.jwt.claims', true)::jsonb->>'user_role') = 'super_admin' )
);